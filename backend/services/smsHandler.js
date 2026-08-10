// PoleSafe — Incoming SMS Command Handler
// Basic phone parents send SMS commands like "BOOK Faith 7AM", "WHERE Faith", "SICK Faith"
// Africa's Talking forwards incoming SMS to this webhook

const User = require('mongoose').model('User');
const Child = require('mongoose').model('Child');
const School = require('mongoose').model('School');
const Booking = require('mongoose').model('Booking');
const Ride = require('mongoose').model('Ride');
const smsService = require('./smsService');
const smsTemplates = require('./smsTemplates');
const smsSession = require('./smsSession');

const COMMANDS = {
  BOOK: 'BOOK',      // BOOK Faith P.3 StMarys 7AM
  CANCEL: 'CANCEL',  // CANCEL Faith
  WHERE: 'WHERE',    // WHERE Faith
  SICK: 'SICK',      // SICK Faith (sick day)
  HELP: 'HELP',       // HELP Faith (emergency)
  RESTORE: 'RESTORE', // RESTORE Faith (undo sick day)
  CONFIRM: 'CONFIRM',
  ARRIVED: 'ARRIVED',
  DROPPED: 'DROPPED',
  PICKED: 'PICKED',
  REGISTER: 'REGISTER', // REGISTER John Doe (self-registration)
};

/**
 * Handle an incoming SMS from Africa's Talking webhook
 */
async function handleIncoming(req, res) {
  try {
    // Africa's Talking sends: from, text, date, id, linkId
    const { from, text, id, linkId } = req.body || req.query;

    if (!from || !text) {
      return res.status(400).send('Missing from or text');
    }

    const phone = from.startsWith('+') ? from : `+${from}`;
    const message = text.trim().toUpperCase();
    const [command, ...args] = message.split(/\s+/);

    // 🧠 Hamna AI Assistant — try AI parsing first for natural language
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const hamna = require('./aiService');
        const kids = user ? await Child.find({ parentId: user._id }).select('name class schoolId') : [];
        const parsed = await hamna.parseSms(text.trim(), {
          name: user?.name || 'Unknown',
          kids: kids.map(k => ({ name: k.name, class: k.class })),
        });

        if (parsed.intent !== 'unknown' && parsed.confidence > 0.5) {
          console.log(`[Hamna] Parsed: ${parsed.intent} (${parsed.confidence}) → ${parsed.response}`);

          // For SMS-only commands like REGISTER, skip Hamna
          if (parsed.intent === 'register') {
            command = 'REGISTER';
          } else {
            // Send Hamna's response and let the existing handler process
            await smsService.send({ to: phone, message: parsed.response });

            // Only return here for support/help — let existing flow handle booking etc.
            if (parsed.intent === 'support' || parsed.intent === 'help') {
              return res.status(200).send('OK');
            }
          }
        }
      } catch (e) {
        console.warn('[Hamna] Parse failed, falling back to keywords:', e.message);
      }
    }

    console.log(`📨 SMS from ${phone}: "${text}"`);

    // Check if user exists (allow REGISTER command for new users)
    const user = await User.findOne({ phone });
    if (!user && command !== 'REGISTER') {
      await smsService.send({
        to: phone,
        message: smsTemplates.unknownUser(phone),
      });
      return res.status(200).send('OK');
    }

    switch (command) {

      // ============================================================
      // REGISTER — Self-registration for new users via SMS
      // Format: REGISTER John Doe
      // ============================================================
      case 'REGISTER': {
        if (user) {
          await smsService.send({ to: phone, message: 'You are already registered!' });
          break;
        }

        const name = args.join(' ');
        if (!name || name.length < 2) {
          await smsService.send({ to: phone, message: 'Please provide your full name: REGISTER John Doe' });
          break;
        }

        // Create new parent user
        const newUser = await User.create({
          name,
          phone,
          role: 'parent',
          isVerified: true,  // Auto-verify SMS users
        });

        await smsService.send({
          to: phone,
          message: `✅ Welcome to PoleSafe, ${name}! You can now book rides via SMS. Reply BOOK to get started.`,
        });
        break;
      }

      // ============================================================
      // BOOK — New ride booking via SMS
      // Format: BOOK Faith P.3 StMarys 7AM
      // ============================================================
      case 'BOOK': {
        const session = await smsSession.getOrCreate(phone, 'booking');
        if (!session.completed) {
          // Step 1: Start booking flow
          const kidName = args[0] || '';
          const kidClass = args[1] || '';
          const schoolName = args.slice(2, -1).join(' ') || '';
          const time = args[args.length - 1] || '7:00 AM';

          // Find or prompt for missing info
          let kid = kidName ? await Child.findOne({ parentId: user._id, name: { $regex: kidName, $options: 'i' } }) : null;
          let school = schoolName ? await School.findOne({ name: { $regex: schoolName, $options: 'i' } }) : null;

          if (!kid) {
            smsSession.update(phone, { step: 'kid_name' });
            await smsService.send({ to: phone, message: smsTemplates.askKidName(user.name) });
            break;
          }

          if (!school) {
            smsSession.update(phone, { step: 'school', context: { kidId: kid._id } });
            await smsService.send({ to: phone, message: smsTemplates.askSchool(kid.name) });
            break;
          }

          // Create booking
          const booking = await Booking.create({
            parentId: user._id,
            childId: kid._id,
            schoolId: school._id,
            type: 'weekly',
            daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            pickupTime: time,
            status: 'active',
            startDate: new Date(),
          });

          smsSession.clear(phone);
          await smsService.send({
            to: phone,
            message: smsTemplates.bookingConfirmed(kid.name, time, school.name),
          });
        }
        break;
      }

      // ============================================================
      // WHERE — Track child's ride status
      // Format: WHERE Faith
      // ============================================================
      case 'WHERE': {
        const kidName = args.join(' ');
        const kid = await Child.findOne({ parentId: user._id, name: { $regex: kidName, $options: 'i' } });
        if (!kid) {
          await smsService.send({ to: phone, message: smsTemplates.kidNotFound(kidName) });
          break;
        }

        const activeRide = await Ride.findOne({
          childId: kid._id,
          status: { $in: ['scheduled', 'en_route', 'picked_up'] },
        }).populate('driverId', 'name phone location');

        if (!activeRide) {
          await smsService.send({ to: phone, message: smsTemplates.noActiveRide(kid.name) });
          break;
        }

        const driverDist = activeRide.driverId?.location?.coordinates
          ? 'nearby' : 'unknown';

        await smsService.send({
          to: phone,
          message: smsTemplates.rideStatus(kid.name, activeRide.status, activeRide.driverId?.name || 'Unknown', driverDist),
        });
        break;
      }

      // ============================================================
      // CANCEL — Cancel today's ride with time-based fine enforcement
      // Format: CANCEL Faith
      // ============================================================
      case 'CANCEL': {
        const cancelKid = args.join(' ');
        const cancelKidDoc = await Child.findOne({ parentId: user._id, name: { $regex: cancelKid, $options: 'i' } });
        if (!cancelKidDoc) {
          await smsService.send({ to: phone, message: smsTemplates.kidNotFound(cancelKid) });
          break;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get upcoming rides to check each one for time-based fees
        const upcomingRides = await Ride.find({
          childId: cancelKidDoc._id,
          scheduledPickupTime: { $gte: today, $lt: tomorrow },
          status: 'scheduled',
        });

        if (upcomingRides.length === 0) {
          await smsService.send({ to: phone, message: `No active rides found for ${cancelKidDoc.name} today.` });
          break;
        }

        const cancellationService = require('./cancellationService');
        let totalFee = 0;
        let feeMessages = [];

        for (const ride of upcomingRides) {
          const result = await cancellationService.applyFee({
            ride,
            parentId: user._id,
            reason: 'user_cancelled',
          });

          ride.status = 'cancelled';
          ride.cancelledBy = 'parent';
          ride.cancellationReason = 'user_cancelled';
          ride.cancelledAt = new Date();
          await ride.save();

          totalFee += result.feeAmount;
          if (!result.evaluation.free) {
            feeMessages.push(result.message);
          }
        }

        let responseMsg = `Cancelled rides for ${cancelKidDoc.name}.`;
        if (totalFee > 0) {
          responseMsg += ` ⚠️ Abrupt cancellation fee: ${totalFee} UGX (charged to your account). Cancelling at least 24h before pickup is free.`;
        } else {
          const isWellBefore = feeMessages.length === 0;
          responseMsg += isWellBefore
            ? ' ✅ Free cancellation. No charge.'
            : ' ✅ No charge.';
        }

        await smsService.send({ to: phone, message: responseMsg });
        break;
      }

      // ============================================================
      // SICK — Report child sick (cancels rides, issues credit)
      // Format: SICK Faith
      // ============================================================
      case 'SICK': {
        const sickKid = args.length === 2 && /^\d+$/.test(args[1])
          ? args[0]
          : args.join(' ');
        const sickDays = args.length === 2 && /^\d+$/.test(args[1]) ? parseInt(args[1]) : 1;

        const kidDoc = await Child.findOne({ parentId: user._id, name: { $regex: sickKid, $options: 'i' } });
        if (!kidDoc) {
          await smsService.send({ to: phone, message: smsTemplates.kidNotFound(sickKid) });
          break;
        }

        // Cancel today's rides
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const daysEnd = new Date();
        daysEnd.setDate(daysEnd.getDate() + sickDays);

        await Ride.updateMany(
          {
            childId: kidDoc._id,
            scheduledPickupTime: { $gte: todayStart, $lt: daysEnd },
            status: 'scheduled',
          },
          { status: 'cancelled', cancellationReason: 'sick_day', cancelledAt: new Date() }
        );

        // Issue credit for sick day
        const Credit = require('mongoose').model('Credit');
        const creditExpiry = new Date();
        creditExpiry.setFullYear(creditExpiry.getFullYear() + 1);

        await Credit.create({
          parentId: user._id,
          childId: kidDoc._id,
          amount: 5000 * sickDays,
          reason: 'sick_day',
          status: 'available',
          expiresAt: creditExpiry,
        });

        await smsService.send({
          to: phone,
          message: smsTemplates.sickDayReported(kidDoc.name, sickDays),
        });
        break;
      }

      // ============================================================
      // HELP — Emergency alert
      // Format: HELP Faith
      // ============================================================
      case 'HELP': {
        const helpKid = args.join(' ');
        const helpKidDoc = await Child.findOne({ parentId: user._id, name: { $regex: helpKid, $options: 'i' } });
        if (!helpKidDoc) {
          await smsService.send({ to: phone, message: smsTemplates.kidNotFound(helpKid) });
          break;
        }

        // Find active ride and notify driver + school
        const activeRide = await Ride.findOne({
          childId: helpKidDoc._id,
          status: { $in: ['scheduled', 'en_route', 'picked_up'] },
        }).populate('driverId', 'name phone');

        // Notify PoleSafe admin (in production, this would trigger the control room)
        console.log(`🚨 EMERGENCY: ${helpKidDoc.name} - Parent ${user.name} (${phone}) alerted`);

        await smsService.send({
          to: phone,
          message: smsTemplates.emergencyAlerted(helpKidDoc.name),
        });

        // Notify driver if ride is active
        if (activeRide?.driverId?.phone) {
          await smsService.send({
            to: activeRide.driverId.phone,
            message: `🚨 EMERGENCY: ${user.name} has raised an alert for ${helpKidDoc.name}. Please check on them immediately. - PoleSafe`,
          });
        }
        break;
      }

      // ============================================================
      // CONFIRM — Confirm schedule changes / booking steps
      // ============================================================
      case 'CONFIRM': {
        const session = await smsSession.get(phone);
        if (session) {
          // Handle multi-step booking confirmation
          smsSession.update(phone, { step: 'confirmed' });
          await smsService.send({ to: phone, message: '✅ Confirmed! Your booking is set.' });
          smsSession.clear(phone);
        } else {
          await smsService.send({ to: phone, message: 'No pending action to confirm.' });
        }
        break;
      }

      // ============================================================
      // RESTORE — Undo a sick day
      // ============================================================
      case 'RESTORE': {
        const restoreKid = args.join(' ');
        const restoreKidDoc = await Child.findOne({ parentId: user._id, name: { $regex: restoreKid, $options: 'i' } });
        if (!restoreKidDoc) {
          await smsService.send({ to: phone, message: smsTemplates.kidNotFound(restoreKid) });
          break;
        }

        // Re-enable cancelled rides
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        await Ride.updateMany(
          {
            childId: restoreKidDoc._id,
            scheduledPickupTime: { $gte: today, $lt: tomorrow },
            cancellationReason: 'sick_day',
          },
          { status: 'scheduled', cancellationReason: null, cancelledAt: null }
        );

        await smsService.send({
          to: phone,
          message: `✅ Restored rides for ${restoreKidDoc.name}. Their pickup is back on schedule.`,
        });
        break;
      }

      // ============================================================
      // ARRIVED / PICKED / DROPPED — Driver status updates via SMS
      // (for drivers with basic phones)
      // ============================================================
      case 'ARRIVED': {
        const driver = await User.findOne({ phone, role: 'driver' });
        if (!driver) break;

        const ride = await Ride.findOne({ driverId: driver._id, status: 'scheduled' });
        if (ride) {
          ride.status = 'en_route';
          await ride.save();
          await smsService.send({ to: phone, message: '✅ Marked as en route.' });
        }
        break;
      }

      case 'PICKED': {
        const driverP = await User.findOne({ phone, role: 'driver' });
        if (!driverP) break;

        const rideP = await Ride.findOne({ driverId: driverP._id, status: 'en_route' });
        if (rideP) {
          rideP.status = 'picked_up';
          rideP.actualPickupTime = new Date();
          await rideP.save();
          await smsService.send({ to: phone, message: '✅ Marked as picked up.' });
        }
        break;
      }

      case 'DROPPED': {
        const driverD = await User.findOne({ phone, role: 'driver' });
        if (!driverD) break;

        const rideD = await Ride.findOne({ driverId: driverD._id, status: 'picked_up' });
        if (rideD) {
          rideD.status = 'dropped_off';
          rideD.actualDropoffTime = new Date();
          await rideD.save();
          await smsService.send({ to: phone, message: '✅ Marked as dropped off.' });
        }
        break;
      }

      // ============================================================
      // HELP — Show available commands
      // ============================================================
      default: {
        await smsService.send({
          to: phone,
          message: smsTemplates.helpGuide(),
        });
        break;
      }
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('[SMS Handler] Error:', err.message);
    res.status(200).send('OK'); // Always return 200 to AT
  }
}

/**
 * Handle delivery reports from Africa's Talking
 */
function handleDeliveryReport(req, res) {
  const { id, status, phoneNumber } = req.query || req.body;
  if (status === 'Failed') {
    console.warn(`📨 SMS delivery failed to ${phoneNumber} (id: ${id})`);
  }
  res.status(200).send('OK');
}

module.exports = { handleIncoming, handleDeliveryReport };
