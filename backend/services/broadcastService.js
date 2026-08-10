// PoleSafe — Broadcast Service
// Multi-channel notification system for school announcements
// One tap → parents (app + SMS) + drivers (app + route update) + teachers

const { Broadcast, School, Ride } = require('../database/schema');
const smsService = require('./smsService');

class BroadcastService {

  /**
   * Send a broadcast from a school
   * 
   * @param {object} params
   * @param {string} params.schoolId
   * @param {string} params.adminId
   * @param {string} params.type - half_day | school_closed | emergency | reminder | custom | meeting | event
   * @param {string} params.message
   * @param {string} [params.newPickupTime] - For half_day: "12:00 PM" — auto-adjusts driver routes
   * @param {string} [params.targetGroups] - 'all', 'parents', 'teachers', 'specific_class', 'morning_only', 'afternoon_only'
   * @returns {object} Broadcast result
   */
  async sendBroadcast({ schoolId, adminId, type, message, newPickupTime, targetGroups }) {
    const school = await School.findById(schoolId).lean();
    if (!school) throw new Error('School not found');

    const Child = require('mongoose').model('Child');
    const kids = await Child.find({ schoolId }).populate('parentId').lean();
    const parentIds = [...new Set(kids.map(k => k.parentId?._id?.toString()).filter(Boolean))];

    // Find teachers (school admin users)
    const User = require('mongoose').model('User');
    const teachers = await User.find({ 
      _id: { $in: school.adminIds },
      role: 'school_admin',
    }).lean();

    // Find drivers
    const drivers = await Ride.distinct('driverId', {
      schoolId,
      status: { $in: ['scheduled', 'en_route', 'picked_up'] },
    });

    // Half-day route adjustment
    if (type === 'half_day' && newPickupTime) {
      await this.adjustDriverRoutes(schoolId, newPickupTime);
    }

    // Determine who to notify
    let notifyParents = targetGroups === 'all' || targetGroups === 'parents' || targetGroups === 'specific_class';
    let notifyTeachers = targetGroups === 'all' || targetGroups === 'teachers';
    let notifyDrivers = targetGroups === 'all' || targetGroups === 'parents';

    // Send SMS to basic phone parents
    let smsCount = 0;
    if (notifyParents) {
      const basicPhoneKids = kids.filter(k => k.parentId && !k.parentId.hasSmartphone);
      for (const kid of basicPhoneKids) {
        try {
          await smsService.send({
            to: kid.parentId.phone,
            message: `${school.name}: ${message} -PoleSafe`,
          });
          smsCount++;
        } catch (err) {
          console.warn(`SMS failed for ${kid.parentId.phone}:`, err.message);
        }
      }
    }

    // Send SMS to teachers (basic phone)
    if (notifyTeachers) {
      for (const teacher of teachers) {
        if (!teacher.hasSmartphone) {
          try {
            await smsService.send({
              to: teacher.phone,
              message: `${school.name} (Staff): ${message} -PoleSafe`,
            });
            smsCount++;
          } catch (err) { console.warn(err.message); }
        }
      }
    }

    // Save broadcast record
    const broadcast = await Broadcast.create({
      schoolId,
      sentByAdminId: adminId,
      type,
      message,
      newPickupTime: newPickupTime || null,
      sentToParents: notifyParents,
      sentToDrivers: notifyDrivers,
      sentToTeachers: notifyTeachers,
      sentViaSMS: smsCount > 0,
      sentViaApp: true,
      parentCount: notifyParents ? parentIds.length : 0,
      teacherCount: notifyTeachers ? teachers.length : 0,
      driverCount: notifyDrivers ? drivers.length : 0,
      smsCount,
    });

    return {
      broadcast,
      notifiedParents: notifyParents ? parentIds.length : 0,
      notifiedDrivers: notifyDrivers ? drivers.length : 0,
      notifiedTeachers: notifyTeachers ? teachers.length : 0,
      smsSent: smsCount,
      routesAdjusted: type === 'half_day' && newPickupTime ? drivers.length : 0,
    };
  }

  /**
   * Auto-adjust all driver routes for a school when half-day announced
   */
  async adjustDriverRoutes(schoolId, newPickupTime) {
    // Parse new pickup time
    const [time, period] = newPickupTime.split(' ');
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours);
    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    if (period === 'AM' && hour24 === 12) hour24 = 0;

    // Find all active afternoon rides for this school
    const affectedRides = await Ride.find({
      schoolId,
      type: 'school_afternoon',
      status: 'scheduled',
      scheduledPickupTime: { $exists: true },
    });

    // Update each ride's pickup time to the new time
    const now = new Date();
    for (const ride of affectedRides) {
      const newTime = new Date(ride.scheduledPickupTime);
      newTime.setHours(hour24, parseInt(minutes), 0, 0);
      ride.scheduledPickupTime = newTime;
      ride.updatedAt = now;
      await ride.save();
    }

    console.log(`🔄 Adjusted ${affectedRides.length} driver routes to ${newPickupTime} for school ${schoolId}`);
    return affectedRides.length;
  }

  /**
   * School reports kid sick — notify parent and update rides
   * 
   * @param {object} params
   * @param {string} params.schoolId
   * @param {string} params.childId
   * @param {string} params.condition - e.g., "Fever 38.5°C"
   */
  async reportSickAtSchool({ schoolId, childId, condition }) {
    const Child = require('mongoose').model('Child');
    const child = await Child.findById(childId).populate('parentId').lean();
    if (!child) throw new Error('Child not found');

    const parent = child.parentId;

    // Send parent notification
    const message = `🩺 ${child.name} is unwell at school. Condition: ${condition}. Options: pick up, send PoleSafe, or keep at school. Reply HELP for details. -PoleSafe`;

    if (parent.hasSmartphone) {
      // App push notification (handled by mobile push service)
      // Parent will see the 3-option screen in app
    } else {
      // SMS parent
      await smsService.send({
        to: parent.phone,
        message,
      });
    }

    return {
      childId,
      parentId: parent._id,
      parentPhone: parent.phone,
      notified: true,
    };
  }
}

module.exports = new BroadcastService();
