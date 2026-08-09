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
}

module.exports = new DriverVettingService();
