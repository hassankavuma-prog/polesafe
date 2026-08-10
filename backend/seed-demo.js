// PoleSafe — Seed/Demo Data Script
// Populates the database with sample data for testing
// Run: npm run seed (or: node seed-demo.js)

const mongoose = require('mongoose');
const config = require('./config');

// Models
const User = mongoose.model('User');
const Child = mongoose.model('Child');
const School = mongoose.model('School');
const Vehicle = mongoose.model('Vehicle');
const Booking = mongoose.model('Booking');
const Ride = mongoose.model('Ride');
const Credit = mongoose.model('Credit');

const DEMO_PHONE = '+256700000001';
const DEMO_PIN = '1234';

async function seed() {
  console.log('🌱 Seeding PoleSafe demo data...\n');

  // Connect
  await mongoose.connect(config.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  // Clear existing demo data
  const collections = [User, Child, School, Vehicle, Booking, Ride, Credit];
  for (const col of collections) {
    await col.deleteMany({});
  }
  console.log('🧹 Cleared existing data\n');

  // ============================================================
  // 1. Create Demo Users
  // ============================================================
  const bcrypt = require('bcryptjs');
  const pinHash = await bcrypt.hash(DEMO_PIN, 10);

  const parent = await User.create({
    phone: '+256701234567',
    name: 'Sarah Nakato',
    role: 'parent',
    pin: pinHash,
    hasSmartphone: true,
    preferredChannel: 'whatsapp',
    email: 'sarah.nakato@example.ug',
    isVerified: true,
  });
  console.log('👩 Created parent:', parent.name);

  const parentBasic = await User.create({
    phone: '+256712345678',
    name: 'Grace Akol',
    role: 'parent',
    pin: pinHash,
    hasSmartphone: false,
    preferredChannel: 'sms',
    smsOptIn: true,
    isVerified: true,
  });
  console.log('👩 Created parent (basic phone):', parentBasic.name);

  const driver = await User.create({
    phone: '+256701112223',
    name: 'Paul Ssempijja',
    role: 'driver',
    pin: pinHash,
    hasSmartphone: true,
    location: {
      type: 'Point',
      coordinates: [32.5810, 0.3198], // Bukoto, Kampala
    },
    isVerified: true,
    driverIdNumber: 'PS-DRV-001',
    isDriverIdVerified: true,
  });
  console.log('🧑‍✈️ Created driver:', driver.name);

  const driver2 = await User.create({
    phone: '+256703334445',
    name: 'Ibrahim Kato',
    role: 'driver',
    pin: pinHash,
    hasSmartphone: true,
    location: {
      type: 'Point',
      coordinates: [32.5780, 0.3150],
    },
    isVerified: true,
    driverIdNumber: 'PS-DRV-002',
    isDriverIdVerified: true,
  });
  console.log('🧑‍✈️ Created driver:', driver2.name);

  const schoolAdmin = await User.create({
    phone: '+256705556667',
    name: 'Mary Nantongo',
    role: 'school_admin',
    pin: pinHash,
    hasSmartphone: true,
    email: 'admin@stmarys.ug',
    isVerified: true,
  });
  console.log('🏫 Created school admin:', schoolAdmin.name);

  const polesafeOwner = await User.create({
    phone: '+256700000000',  // Change to actual owner phone
    name: 'PoleSafe Owner',
    role: 'polesafe_admin',
    polesafeAdminRole: 'owner',
    pin: pinHash,
    hasSmartphone: true,
    isVerified: true,
  });
  console.log('🛡️ Created PoleSafe Owner (login: +256700000000 / PIN: 1234)\n');

  // ============================================================
  // 2. Create School
  // ============================================================
  const school = await School.create({
    name: 'St. Mary\'s Primary School',
    headTeacherName: 'Mr. John Wasswa',
    headTeacherPhone: '+256700100200',
    address: 'Plot 42, Bukoto, Kampala',
    location: {
      type: 'Point',
      coordinates: [32.5830, 0.3210],
    },
    termSchedule: {
      currentTerm: {
        startDate: new Date('2026-08-01'),
        endDate: new Date('2026-12-15'),
        pickupTime: '7:00 AM',
        dropoffTime: '4:30 PM',
      },
    },
    verificationStatus: 'verified',
    verifiedBy: polesafeOwner._id,
    verifiedAt: new Date(),
    commissionRate: 0.05,
    hasAffiliate: true,
    adminIds: [schoolAdmin._id],
    hasWaitingZone: true,
  });
  console.log('🏫 Created school:', school.name);

  // ============================================================
  // 3. Create Children
  // ============================================================
  const faith = await Child.create({
    parentId: parent._id,
    name: 'Faith Nakato',
    class: 'P.3',
    schoolId: school._id,
    finishTime: '3:30 PM',
    age: 8,
    requiresCarSeat: false,
    medical: {
      hasCondition: false,
    },
  });
  console.log('👧 Created child:', faith.name);

  const akol = await Child.create({
    parentId: parent._id,
    name: 'Akol Nakato',
    class: 'P.5',
    schoolId: school._id,
    finishTime: '4:30 PM',
    age: 10,
    requiresCarSeat: false,
    siblingIds: [faith._id],
    medical: {
      hasCondition: true,
      condition: 'Asthma',
      emergencyInstruction: 'Carry inhaler at all times',
    },
  });
  console.log('👦 Created child:', akol.name);

  // Link siblings
  faith.siblingIds = [akol._id];
  await faith.save();

  const graceKid = await Child.create({
    parentId: parentBasic._id,
    name: 'Grace\'s Kid',
    class: 'P.1',
    schoolId: school._id,
    finishTime: '3:30 PM',
    age: 6,
  });
  console.log('👧 Created child:', graceKid.name);

  // ============================================================
  // 4. Create Vehicles
  // ============================================================
  await Vehicle.create({
    driverId: driver._id,
    type: 'car',
    registrationNumber: 'UAR 123X',
    capacity: 4,
    hasCarSeat: true,
    isApproved: true,
  });
  console.log('🚗 Created vehicle for driver');

  await Vehicle.create({
    driverId: driver2._id,
    type: 'boda',
    registrationNumber: 'UDP 456Y',
    capacity: 1,
    hasCarSeat: false,
    isApproved: true,
  });
  console.log('🏍️ Created vehicle for driver 2\n');

  // ============================================================
  // 5. Create Weekly Bookings
  // ============================================================
  const booking = await Booking.create({
    parentId: parent._id,
    childId: faith._id,
    driverId: driver._id,
    schoolId: school._id,
    type: 'weekly',
    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    pickupTime: '7:00 AM',
    dropoffTime: '4:30 PM',
    vehicleType: 'car',
    staggeredPickups: [
      { childId: faith._id, pickupTime: '3:30 PM', unifiedPickup: false },
      { childId: akol._id, pickupTime: '4:30 PM', unifiedPickup: false },
    ],
    totalAmount: 50000,
    amountPerTrip: 5000,
    totalTrips: 10,
    completedTrips: 2,
    status: 'active',
    startDate: new Date('2026-08-03'),
    endDate: new Date('2026-08-14'),
  });
  console.log('📅 Created booking:', booking.type);

  // ============================================================
  // 6. Create Sample Rides (today's schedule)
  // ============================================================
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const morningPickup = new Date(`${todayStr}T07:00:00Z`);
  const afternoonPickup = new Date(`${todayStr}T16:30:00Z`);

  await Ride.create({
    childId: faith._id,
    driverId: driver._id,
    parentId: parent._id,
    schoolId: school._id,
    bookingId: booking._id,
    type: 'school_morning',
    scheduledPickupTime: morningPickup,
    scheduledDropoffTime: new Date(`${todayStr}T07:30:00Z`),
    pickupLocation: {
      type: 'Point',
      coordinates: [32.5810, 0.3198],
      address: 'Home - Bukoto',
    },
    dropoffLocation: {
      type: 'Point',
      coordinates: [32.5830, 0.3210],
      address: 'St. Mary\'s School',
    },
    distanceKm: 5.2,
    baseFare: 2000,
    fuelMultiplier: 1.0,
    totalPrice: 5000,
    driverPayout: 4250,
    poleSafeCommission: 750,
    status: 'completed',
    actualPickupTime: new Date(`${todayStr}T07:02:00Z`),
    actualDropoffTime: new Date(`${todayStr}T07:28:00Z`),
  });
  console.log('🚗 Created morning drop-off ride');

  await Ride.create({
    childId: akol._id,
    driverId: driver._id,
    parentId: parent._id,
    schoolId: school._id,
    bookingId: booking._id,
    type: 'school_afternoon',
    scheduledPickupTime: afternoonPickup,
    pickupLocation: {
      type: 'Point',
      coordinates: [32.5830, 0.3210],
      address: 'St. Mary\'s School',
    },
    dropoffLocation: {
      type: 'Point',
      coordinates: [32.5810, 0.3198],
      address: 'Home - Bukoto',
    },
    distanceKm: 5.2,
    baseFare: 2000,
    fuelMultiplier: 1.0,
    totalPrice: 5000,
    driverPayout: 4250,
    poleSafeCommission: 750,
    status: 'scheduled',
  });
  console.log('🚗 Created afternoon pickup ride\n');

  // ============================================================
  // 7. Create Sample Credits
  // ============================================================
  const creditExpiry = new Date();
  creditExpiry.setFullYear(creditExpiry.getFullYear() + 1);

  await Credit.create({
    parentId: parent._id,
    amount: 5000,
    reason: 'sick_day',
    status: 'available',
    expiresAt: creditExpiry,
  });
  console.log('💰 Created sample credit\n');

  // ============================================================
  // Summary
  // ============================================================
  console.log('═══════════════════════════════════════');
  console.log('🌱 SEED COMPLETE!');
  console.log('═══════════════════════════════════════');
  console.log('');
  console.log('📱 Demo Login Credentials:');
  console.log('   Parent:     +256701234567 / PIN: 1234');
  console.log('   Parent (SMS): +256712345678 / PIN: 1234');
  console.log('   Driver:     +256701112223 / PIN: 1234');
  console.log('   Driver 2:   +256703334445 / PIN: 1234');
  console.log('   School Admin: +256705556667 / PIN: 1234');
  console.log('   PoleSafe Owner: +256700000000 / PIN: 1234');
  console.log('   🌐 Admin Dashboard: http://localhost:5000/admin.html');
  console.log('');
  console.log('📊 Created:');
  console.log(`   Users:    6`);
  console.log(`   Schools:  1`);
  console.log(`   Children: 3`);
  console.log(`   Vehicles: 2`);
  console.log(`   Bookings: 1`);
  console.log(`   Rides:    2`);
  console.log(`   Credits:  1`);

  await mongoose.disconnect();
  console.log('\n👋 Done!');

}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
