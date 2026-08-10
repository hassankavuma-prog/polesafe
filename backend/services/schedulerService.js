// PoleSafe Scheduler Service — Background Jobs
// Handles: Friday auto-payouts, expired quote cleanup, reminder dispatch
// Uses node-cron for recurring tasks

const cron = require('node-cron');
const mongoose = require('mongoose');
const config = require('../config');

const { WithdrawalRequest, User, QuoteRequest, DriverNotification } = require('../database/schema');
const NotificationService = require('./notificationService');

class SchedulerService {
  constructor() {
    this.jobs = [];
  }

  /**
   * Start all scheduled jobs
   */
  start() {
    console.log('🚀 SchedulerService: Starting background jobs...');

    // 1. Friday Auto-Payout Processor — Every Friday at 6PM
    this.jobs.push(
      cron.schedule('0 18 * * 5', () => this.processFridayPayouts(), {
        timezone: 'Africa/Kampala',
      })
    );
    console.log('  ✅ Friday auto-payout cron (Fri 6PM EAT)');

    // 2. Expired Quote Cleanup — Every 30 minutes
    this.jobs.push(
      cron.schedule('*/30 * * * *', () => this.cleanupExpiredQuotes(), {
        timezone: 'Africa/Kampala',
      })
    );
    console.log('  ✅ Expired quote cleanup (every 30 min)');

    // 3. T-60 Reminder Dispatch — Every 15 minutes
    this.jobs.push(
      cron.schedule('*/15 * * * *', () => this.dispatchReminders(), {
        timezone: 'Africa/Kampala',
      })
    );
    console.log('  ✅ T-60/T-30 reminder dispatch (every 15 min)');

    // 4. Expired QuoteRequests — Hourly
    this.jobs.push(
      cron.schedule('0 * * * *', () => this.closeStaleQuoteRequests(), {
        timezone: 'Africa/Kampala',
      })
    );
    console.log('  ✅ Stale quote request closure (hourly)');

    console.log('🎯 SchedulerService: All jobs running.');
  }

  /**
   * Stop all jobs (for clean shutdown)
   */
  stop() {
    this.jobs.forEach(job => job.stop());
    console.log('🛑 SchedulerService: All jobs stopped.');
  }

  // ================================================================
  // 1. FRIDAY AUTO-PAYOUT PROCESSOR
  // ================================================================
  async processFridayPayouts() {
    console.log(`[Scheduler] processFridayPayouts — ${new Date().toISOString()}`);
    try {
      // Find all scheduled withdrawals due for processing
      // (scheduledPayoutDate <= now and status = 'scheduled' or status = 'pending')
      const today = new Date();
      const dueWithdrawals = await WithdrawalRequest.find({
        withdrawalType: 'scheduled',
        status: { $in: ['scheduled', 'pending'] },
        scheduledPayoutDate: { $lte: today },
      }).populate('driverId', 'name phone earningsBalance mobileMoneyNumber payoutMethod');

      if (dueWithdrawals.length === 0) {
        console.log('[Scheduler] No due payouts found.');
        return;
      }

      console.log(`[Scheduler] Processing ${dueWithdrawals.length} Friday payouts...`);

      for (const withdrawal of dueWithdrawals) {
        try {
          // Mark as processing
          withdrawal.status = 'processing';
          await withdrawal.save();

          // TODO: Integrate with Flutterwave/Africa's Talking for actual payout
          // For now, deduct from earningsBalance and mark completed
          const driver = withdrawal.driverId;
          if (driver) {
            driver.earningsBalance -= withdrawal.amount;
            driver.lastPayoutDate = new Date();
            await driver.save();
          }

          withdrawal.status = 'completed';
          withdrawal.processedAt = new Date();
          withdrawal.transactionId = `AUTO-${Date.now()}`;
          await withdrawal.save();

          // Log notification
          await DriverNotification.create({
            driverId: withdrawal.driverId,
            type: 'payout_friday',
            channel: 'push',
            message: `✅ Friday payout of ${withdrawal.amount.toLocaleString('en-UG')} UGX processed to your ${withdrawal.payoutMethod === 'bank' ? 'bank account' : 'mobile money'}.`,
            delivered: true,
            sentAt: new Date(),
          });

          console.log(`  ✅ Payout ${withdrawal.amount.toLocaleString('en-UG')} UGX → driver ${withdrawal.driverId}`);
        } catch (err) {
          console.error(`  ❌ Failed to process withdrawal ${withdrawal._id}:`, err.message);
          withdrawal.status = 'failed';
          withdrawal.adminNote = `Auto-failed: ${err.message}`;
          await withdrawal.save();
        }
      }
    } catch (err) {
      console.error('[Scheduler] processFridayPayouts error:', err.message);
    }
  }

  // ================================================================
  // 2. EXPIRED QUOTE CLEANUP
  // ================================================================
  async cleanupExpiredQuotes() {
    console.log(`[Scheduler] cleanupExpiredQuotes — ${new Date().toISOString()}`);
    try {
      const result = await QuoteRequest.updateMany(
        {
          status: 'open',
          expiresAt: { $lte: new Date() },
        },
        { status: 'expired' }
      );
      if (result.modifiedCount > 0) {
        console.log(`[Scheduler] Expired ${result.modifiedCount} quote requests.`);
      }
    } catch (err) {
      console.error('[Scheduler] cleanupExpiredQuotes error:', err.message);
    }
  }

  // ================================================================
  // 3. REMINDER DISPATCH (T-60 / T-30)
  // ================================================================
  async dispatchReminders() {
    console.log(`[Scheduler] dispatchReminders — ${new Date().toISOString()}`);
    try {
      // Find rides starting in ~60 minutes or ~30 minutes that haven't had reminders sent
      const now = new Date();
      const in60Min = new Date(now.getTime() + 60 * 60 * 1000);
      const in30Min = new Date(now.getTime() + 30 * 60 * 1000);

      const Ride = mongoose.model('Ride');

      // T-60: Rides starting in ~60 minutes
      const t60Rides = await Ride.find({
        scheduledPickupTime: {
          $gte: new Date(now.getTime() + 55 * 60 * 1000),
          $lte: new Date(now.getTime() + 65 * 60 * 1000),
        },
        status: { $in: ['confirmed', 'assigned'] },
        'notificationsSent.t60': { $ne: true },
      }).populate('driverId', 'name phone preferredChannel');

      for (const ride of t60Rides) {
        const notif = await DriverNotification.create({
          driverId: ride.driverId?._id || ride.driverId,
          bookingId: ride.bookingId,
          rideId: ride._id,
          type: 'reminder_t60',
          channel: 'push',
          message: `🚸 Your pickup is in 1 hour. Please go online by T-30 or the ride may be reassigned.`,
          delivered: true,
          sentAt: new Date(),
        });

        // Mark reminder sent
        ride.notificationsSent.t60 = true;
        await ride.save();

        console.log(`  📨 T-60 reminder sent for ride ${ride._id}`);
      }

      // T-30: Rides starting in ~30 minutes
      const t30Rides = await Ride.find({
        scheduledPickupTime: {
          $gte: new Date(now.getTime() + 25 * 60 * 1000),
          $lte: new Date(now.getTime() + 35 * 60 * 1000),
        },
        status: { $in: ['confirmed', 'assigned'] },
        'notificationsSent.t30': { $ne: true },
      }).populate('driverId', 'name phone preferredChannel');

      for (const ride of t30Rides) {
        const notif = await DriverNotification.create({
          driverId: ride.driverId?._id || ride.driverId,
          bookingId: ride.bookingId,
          rideId: ride._id,
          type: 'reminder_t30',
          channel: 'push',
          message: `⚠️ 30 MINUTES to pickup. Go online now or the ride will be reassigned.`,
          delivered: true,
          sentAt: new Date(),
        });

        ride.notificationsSent.t30 = true;
        await ride.save();

        console.log(`  📨 T-30 reminder sent for ride ${ride._id}`);
      }

      if (t60Rides.length + t30Rides.length > 0) {
        console.log(`[Scheduler] Sent ${t60Rides.length} T-60 + ${t30Rides.length} T-30 reminders.`);
      }
    } catch (err) {
      console.error('[Scheduler] dispatchReminders error:', err.message);
    }
  }

  // ================================================================
  // 4. CLOSE STALE QUOTE REQUESTS
  // ================================================================
  async closeStaleQuoteRequests() {
    console.log(`[Scheduler] closeStaleQuoteRequests — ${new Date().toISOString()}`);
    try {
      // Close quote requests older than 24 hours with no quotes
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = await QuoteRequest.updateMany(
        {
          status: 'open',
          createdAt: { $lte: cutoff },
        },
        { status: 'expired' }
      );
      if (result.modifiedCount > 0) {
        console.log(`[Scheduler] Closed ${result.modifiedCount} stale quote requests (24h+).`);
      }
    } catch (err) {
      console.error('[Scheduler] closeStaleQuoteRequests error:', err.message);
    }
  }

  // ================================================================
  // MANUAL TRIGGERS (for testing / admin)
  // ================================================================

  /**
   * Manually trigger Friday payout processing (for admin panel + testing)
   */
  async manualProcessPayouts() {
    await this.processFridayPayouts();
    return { message: 'Manual payout processing complete' };
  }
}

module.exports = new SchedulerService();
