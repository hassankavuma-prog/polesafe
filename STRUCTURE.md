# PoleSafe — Full Stack Application Codebase
# From Home to School. And Beyond. 🚸🚗
#
# === PROJECT STRUCTURE ===
#
# backend/
#   server.js              — Express entry point
#   config.js              — Environment config
#   database/
#     schema.js            — MongoDB schemas
#     indexes.js           — Database indexes
#     seed.js              — Seed data
#   middleware/
#     auth.js              — JWT + SMS auth
#     roles.js             — Parent/Driver/School role guard
#     validate.js          — Input validation
#   models/
#     User.js              — User model (parent/driver/school)
#     Child.js             — Child/kid profile
#     Ride.js              — Ride/schedule model
#     Vehicle.js           — Driver vehicle info
#     School.js            — School profile
#     Booking.js           — Weekly/monthly subscription
#     Transaction.js       — Payment records
#     Credit.js            — Credit system
#     Broadcast.js         — School announcements
#   routes/
#     auth.js              — Login, register, SMS verify
#     parents.js           — Parent endpoints
#     drivers.js           — Driver endpoints
#     schools.js           — School admin endpoints
#     rides.js             — Ride booking & tracking
#     payments.js          — Payment processing
#     broadcasts.js        — School broadcast system
#     credits.js           — Credit management
#   services/
#     fuelAdjustment.js    — Dynamic fuel pricing engine
#     schoolPremium.js     — School premium calculation
#     creditService.js     — Credit accrual & redemption
#     routeService.js      — Driver route optimization
#     broadcastService.js  — Multi-channel notification
#     smsService.js        — SMS gateway
#     paymentService.js    — Flutterwave/Momo integration
#   utils/
#     constants.js         — App constants
#     helpers.js           — Utility functions
#
# mobile/
#   PoleSafeApp.js         — Root React Native app
#   navigation.js          — Navigation/routing
#   screens/
#     ParentDashboard.js   — Parent home screen
#     ParentBooking.js     — Weekly booking screen
#     ParentTrack.js       — Live tracking
#     ParentSickDay.js     — Sick day report
#     ParentEarlyPickup.js — Early pickup
#     ParentCredits.js     — Credits balance
#     DriverDashboard.js   — Driver home screen
#     DriverRoute.js       — Route & navigation
#     DriverEarnings.js    — Earnings & history
#     DriverToggle.js      — School/Ride mode toggle
#     SchoolDashboard.js   — School admin home
#     SchoolBroadcast.js   — Broadcast screen
#     SchoolGateCheck.js   — Gate check-in screen
#     SchoolDetention.js   — Late pickup updates
#     RideHailing.js       — PoleSafe Ride mode
#   components/
#     RideCard.js          — Ride card component
#     KidAvatar.js         — Kid profile avatar
#     StatusBadge.js       — Status indicator
#     QuickActions.js      — Quick action buttons
#   services/
#     api.js               — API client
#     tracking.js          — GPS tracking service
#
# sms/
#   smsHandler.js          — SMS command handler
#   smsTemplates.js        — SMS response templates
#   smsSession.js          — SMS session management
