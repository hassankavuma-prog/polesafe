// PoleSafe — Driver Vetting & Onboarding Service
// Handles driver registration, document verification, and approval

const { User, Vehicle, Ride } = require('../database/schema');
const notificationService = require('./notificationService');

class DriverVettingService {

  /**
   * Driver submits onboarding application
   */
  async applyAsDriver({ userId, vehicleType, registrationNumber, capacity, hasCarSeat, isWheelchairAccessible }) {
    // Check if already has vehicle registered
    let vehicle = await Vehicle.findOne({ driverId: userId });

    if (vehicle) {
      vehicle.type = vehicleType;
      vehicle.registrationNumber = registrationNumber;
      vehicle.capacity = capacity;
      vehicle.hasCarSeat = hasCarSeat;
      vehicle.isWheelchairAccessible = isWheelchairAccessible;
      vehicle.isApproved = false; // Reset approval on update
    } else {
      vehicle = await Vehicle.create({
        driverId: userId,
        type: vehicleType,
        registrationNumber,
        capacity: capacity || (vehicleType === 'boda' ? 2 : 4),
        hasCarSeat: hasCarSeat || false,
        isWheelchairAccessible: isWheelchairAccessible || false,
        isApproved: false,
      });
    }

    await vehicle.save();

    return {
      vehicle,
      status: 'pending_review',
      message: 'Your application is submitted. PoleSafe will review and approve within 24 hours.',
      nextSteps: [
        '1. We\'ll verify your vehicle details',
        '2. We\'ll check your driver history',
        '3. You\'ll get a WhatsApp/SMS when approved',
      ],
    };
  }

  /**
   * PoleSafe admin approves a driver
   */
  async approveDriver(driverId, adminId) {
    const vehicle = await Vehicle.findOne({ driverId }).populate('driverId');
    if (!vehicle) throw new Error('No vehicle found for this driver');

    vehicle.isApproved = true;
    await vehicle.save();

    // Update user as verified
    await User.findByIdAndUpdate(driverId, { isVerified: true });

    // Notify driver
    await notificationService.send({
      userId: driverId,
      phone: vehicle.driverId.phone,
      preferredChannel: vehicle.driverId.preferredChannel || 'whatsapp',
      template: 'default',
      data: {
        message: `✅ PoleSafe Driver Approved!\n\nYour vehicle (${vehicle.type} - ${vehicle.registrationNumber}) is now approved.\n\nYou can start accepting rides! Open the app to begin.\n\nWelcome to PoleSafe 🚗`,
      },
      type: 'alert',
    });

    return {
      driverId,
      vehicle,
      approved: true,
      message: 'Driver approved and notified.',
    };
  }

  /**
   * Reject a driver application
   */
  async rejectDriver(driverId, adminId, reason) {
    const vehicle = await Vehicle.findOne({ driverId }).populate('driverId');

    await notificationService.send({
      userId: driverId,
      phone: vehicle?.driverId?.phone,
      preferredChannel: 'sms',
      template: 'default',
      data: {
        message: `❌ PoleSafe Driver Application\n\nYour application was not approved.\nReason: ${reason || 'Documents need review'}\n\nContact us on WhatsApp for more details. -PoleSafe`,
      },
      type: 'alert',
    });

    return { driverId, rejected: true, reason };
  }

  /**
   * Get all pending driver applications (for admin)
   */
  async getPendingApplications() {
    const vehicles = await Vehicle.find({ isApproved: false })
      .populate('driverId', 'name phone createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return vehicles.map(v => ({
      driverId: v.driverId?._id,
      driverName: v.driverId?.name,
      driverPhone: v.driverId?.phone,
      appliedAt: v.driverId?.createdAt,
      vehicleType: v.type,
      registration: v.registrationNumber,
      capacity: v.capacity,
      hasCarSeat: v.hasCarSeat,
      isWheelchairAccessible: v.isWheelchairAccessible,
    }));
  }

  /**
   * Get verified drivers for a school
   */
  async getAvailableDrivers(schoolId) {
    // Find drivers who have completed rides for this school
    const driverIds = await Ride.distinct('driverId', { schoolId });

    const drivers = await User.find({
      _id: { $in: driverIds },
      role: 'driver',
      isVerified: true,
    }).lean();

    const vehicles = await Vehicle.find({
      driverId: { $in: driverIds },
      isApproved: true,
    }).lean();

    return drivers.map(d => {
      const vehicle = vehicles.find(v => v.driverId.toString() === d._id.toString());
      return {
        id: d._id,
        name: d.name,
        phone: d.phone,
        vehicle: vehicle ? { type: vehicle.type, plate: vehicle.registrationNumber } : null,
        hasCarSeat: vehicle?.hasCarSeat || false,
      };
    });
  }

  // ═══════════════════════════════════════════════════
  //  PHASE 13: Driver Onboarding Document Verification
  // ═══════════════════════════════════════════════════

  /**
   * Driver submits onboarding documents for review
   */
  async submitDocuments(driverId, docs) {
    const user = await User.findById(driverId);
    if (!user) throw new Error('Driver not found');
    if (user.role !== 'driver') throw new Error('User is not a driver');

    const cleanDocs = {
      ...user.verificationDocs,
      ...docs,
    };

    // Merge submitted docs into user record
    user.verificationDocs = cleanDocs;
    user.verificationStatus = 'pending';
    user.verificationSubmittedAt = new Date();
    if (cleanDocs.ninNumber && !user.driverIdNumber) {
      user.driverIdNumber = `PS-DRV-${String(Date.now()).slice(-6)}`;
    }
    await user.save();

    return {
      status: 'pending',
      message: 'Your documents have been submitted for review. You will be notified once approved.',
    };
  }

  /**
   * Get all drivers pending or needing document review
   */
  async getPendingVerifications() {
    const drivers = await User.find({
      role: 'driver',
      verificationStatus: { $in: ['pending', 'rejected'] },
    })
      .select('name phone email verificationDocs verificationStatus verificationNotes verificationSubmittedAt createdAt')
      .sort({ verificationSubmittedAt: -1 })
      .lean();

    return drivers.map(d => ({
      _id: d._id,
      name: d.name,
      phone: d.phone,
      email: d.email,
      docs: d.verificationDocs || {},
      status: d.verificationStatus,
      notes: d.verificationNotes,
      submittedAt: d.verificationSubmittedAt,
      joinedAt: d.createdAt,
    }));
  }

  /**
   * Admin approves a driver's verification
   */
  async approveVerification(driverId, adminId) {
    const user = await User.findById(driverId);
    if (!user || user.role !== 'driver') throw new Error('Driver not found');

    user.verificationStatus = 'approved';
    user.verificationReviewedBy = adminId;
    user.verificationReviewedAt = new Date();
    user.verificationNotes = '';
    user.isVerified = true;
    await user.save();

    // Also approve their vehicle if exists
    await Vehicle.findOneAndUpdate(
      { driverId },
      { isApproved: true },
    );

    // Notify driver
    try {
      await notificationService.send({
        userId: driverId,
        phone: user.phone,
        preferredChannel: user.preferredChannel || 'sms',
        template: 'default',
        data: {
          message: `✅ PoleSafe Driver Approved!\n\nYour documents have been verified.\n\nYou can now start accepting rides. Open the app and go online!\n\nWelcome to PoleSafe 🚗`,
        },
        type: 'alert',
      });
    } catch {}

    return { driverId, status: 'approved', message: 'Driver approved and notified.' };
  }

  /**
   * Admin rejects a driver's verification with reason
   */
  async rejectVerification(driverId, adminId, reason) {
    const user = await User.findById(driverId);
    if (!user || user.role !== 'driver') throw new Error('Driver not found');

    user.verificationStatus = 'rejected';
    user.verificationReviewedBy = adminId;
    user.verificationReviewedAt = new Date();
    user.verificationNotes = reason;
    await user.save();

    // Notify driver
    try {
      await notificationService.send({
        userId: driverId,
        phone: user.phone,
        preferredChannel: user.preferredChannel || 'sms',
        template: 'default',
        data: {
          message: `❌ PoleSafe Document Review\n\nYour documents were not approved.\nReason: ${reason || 'Please resubmit with clearer photos'}\n\nOpen the app to resubmit. -PoleSafe`,
        },
        type: 'alert',
      });
    } catch {}

    return { driverId, status: 'rejected', reason };
  }

  /**
   * Get a single driver's verification status
   */
  async getVerificationStatus(driverId) {
    const user = await User.findById(driverId)
      .select('verificationDocs verificationStatus verificationNotes verificationSubmittedAt verificationReviewedAt')
      .lean();

    if (!user) throw new Error('Driver not found');

    return {
      driverId: user._id,
      status: user.verificationStatus || 'not_submitted',
      isVerified: !!user.isVerified,
      docs: user.verificationDocs || {},
      notes: user.verificationNotes || '',
      submittedAt: user.verificationSubmittedAt,
      reviewedAt: user.verificationReviewedAt,
    };
  }
}

module.exports = new DriverVettingService();
