# PoleSafe School Tour/Trip System 🚌

## Overview

Add **taxis (14-seat minibuses) and coaches (big buses)** to PoleSafe so schools can book them for **field trips, sports days, and tours**. This is separate from daily school runs — it's for one-off school-organized events.

Two scenarios:
- **Schools with own fleet** → PoleSafe as fleet management + parent communication tool
- **Schools without fleet** → PoleSafe connects them to registered bus/taxi drivers

> **Individual bookings** (someone booking a taxi/bus for personal use) follow the existing ride-hailing flow — no kid lists, no teacher notifications, no multi-parent tracking.

---

## Table of Contents

1. [Vehicle Types](#1-vehicle-types)
2. [School Trip Model](#2-school-trip-model)
3. [School Fleet Management](#3-school-fleet-management)
4. [Third-Party Bus Booking](#4-third-party-bus-booking)
5. [Admin Trip Creation Flow](#5-admin-trip-creation-flow)
6. [Driver Confirmation & Kid List](#6-driver-confirmation--kid-list)
7. [Teacher Notifications](#7-teacher-notifications)
8. [Parent Notifications](#8-parent-notifications)
9. [Live Tracking & Speed Monitoring](#9-live-tracking--speed-monitoring)
10. [Capacity Enforcement](#10-capacity-enforcement)
11. [School Admin Dashboard](#11-school-admin-dashboard)
12. [Database Schema Changes](#12-database-schema-changes)
13. [API Endpoints](#13-api-endpoints)
14. [Mobile Screen Changes](#14-mobile-screen-changes)

---

## 1. Vehicle Types

Extend the vehicle type enum to include larger vehicles:

```js
// Before
type: ['car', 'boda']

// After
type: ['car', 'boda', 'taxi', 'bus']
```

| Type | Description | Typical Capacity | Use Case |
|---|---|---|---|
| `car` | Sedan/SUV | 3-4 passengers | Daily school runs |
| `boda` | Motorcycle | 1 passenger | Daily school runs |
| `taxi` | Minibus (14-seater) | ~14 passengers | Small group trips |
| `bus` | Coach/big bus | ~30-60 passengers | Full class/grade trips |

### Vehicle Owner

Add an `owner` field to distinguish school fleet vs. independent driver:

```js
owner: {
  type: mongoose.Schema.Types.ObjectId,
  refPath: 'ownerModel',
  required: true,
},
ownerModel: {
  type: String,
  enum: ['User', 'School'], // 'User' = independent driver, 'School' = school fleet
  required: true,
}
```

- If `ownerModel: 'User'` → vehicle belongs to an independent driver (standard)
- If `ownerModel: 'School'` → vehicle is part of a school's fleet

---

## 2. School Trip Model

New database model for school-organized trips:

```js
const schoolTripSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // school admin

  // Trip details
  tripName: { type: String, required: true },           // "P.5 Museum Trip"
  description: String,                                    // Optional details
  destination: { type: String, required: true },          // "Uganda Museum"
  departureDate: { type: Date, required: true },
  returnDate: { type: Date },
  departureTime: String,                                  // "08:00 AM"
  returnTime: String,                                     // "04:00 PM"

  // Vehicle assignment
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vehicleSource: { type: String, enum: ['fleet', 'external'], default: 'external' },

  // Capacity
  maxSeats: { type: Number, required: true },              // From vehicle's registered capacity
  assignedKids: [{
    childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child' },
    childName: String,
    className: String,
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    parentPhone: String,
    assignedAt: { type: Date, default: Date.now },
  }],
  seatsFilled: { type: Number, default: 0 },               // Count of assigned kids

  // Driver's bus label (admin names it)
  busLabel: String,                                        // "Bus #3", "Bus #5", etc.

  // Status flow
  status: {
    type: String,
    enum: ['draft', 'open', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'draft',
  },
  driverConfirmedAt: Date,
  startedAt: Date,
  completedAt: Date,

  // Tracking
  trackingId: { type: mongoose.Schema.Types.ObjectId, ref: 'TrackingSession' },

  // Notifications
  notificationsSent: {
    teachers: { type: Boolean, default: false },
    parents: { type: Boolean, default: false },
  },

}, { timestamps: true });
```

---

## 3. School Fleet Management

### Registering School-Owned Buses

School admin adds their own buses from the dashboard:

- Bus name/label: "Bus #3" (free-text, admin chooses)
- Registration number: "UBA 123K"
- Capacity: 50 seats
- Driver: select from school-employed drivers on the platform

The vehicle is created with `ownerModel: 'School'` and `owner: schoolId`.

### My Fleet Dashboard

School admin sees:
- All their buses with status (Available / On Trip / Maintenance)
- Quick actions: Assign to Trip, View Schedule, Edit Details
- Add new bus to fleet
- Remove bus from fleet

### School-Employed Drivers

- Drivers linked to a school via the vehicle's `schoolId` owner
- Same driver app experience — they see assigned kids, confirm trips, start tracking
- No payment transaction for fleet trips (school owns the bus)

---

## 4. Third-Party Bus Booking

### Driver Registration for Taxi/Bus

Independent taxi/bus owners register as drivers on PoleSafe:
- Vehicle type: `taxi` or `bus`
- Owner: themselves (`ownerModel: 'User'`)
- Capacity: declared seat count (verified during onboarding)
- Standard driver approval process

### School Booking Flow

1. School admin creates a trip
2. Selects vehicle source: **External** (third-party)
3. Searches/browses available taxi/bus drivers in their area
4. Sends booking request
5. Driver receives and confirms on their app
6. Payment handled separately (school pays driver — PoleSafe facilitates but doesn't process)

---

## 5. Admin Trip Creation Flow

### Step-by-Step

1. **School Admin** navigates to **Trips** section on dashboard
2. Clicks **"Create New Trip"**
3. Fills in:
   - Trip name (e.g., "P.5 Museum Visit")
   - Destination
   - Date & time (departure + return)
   - Description (optional)
4. Selects **Vehicle Source**:
   - **My Fleet** → pick from school's registered buses
   - **Book External** → browse available taxi/bus drivers
5. Selects vehicle/driver
6. **Assign Kids**:
   - Searches/filters students by class
   - Checks kids to add to the trip
   - System shows: **"34 assigned / 50 seats"** — can't exceed capacity
   - Admin names the bus: "Bus #3" (free label)
7. Saves trip → status: **`open`** (pending driver confirmation)

---

## 6. Driver Confirmation & Kid List

### Driver App — Trip Request Screen

When a school creates a trip and assigns their bus (or books external), the driver receives a notification:

```
🚌 New School Trip
P.5 Museum Visit — Uganda Museum
Departure: Fri, Aug 14 at 8:00 AM
Seats: 34/50

[✅ Confirm]  [❌ Decline]
```

### After Confirmation

Driver sees full trip details with assigned kids:

```
┌─────────────────────────────┐
│  🚌 Trip: P.5 Museum Visit  │
│  Bus: Bus #3 (UBA 123K)    │
│  Destination: Uganda Museum │
│  Depart: 8:00 AM           │
│  Return: 4:00 PM           │
├─────────────────────────────┤
│  👦 Passengers (34)         │
│  ┌───────────────────────┐ │
│  │ 1. Faith Akol — P.5A │ │
│  │ 2. Joseph Ssempijja   │ │
│  │ 3. Nakato Sarah       │ │
│  │ ... up to 34 kids     │ │
│  └───────────────────────┘ │
│                             │
│  [🟢 Start Trip]            │
│  [📞 Call Admin]            │
└─────────────────────────────┘
```

---

## 7. Teacher Notifications

When a trip is confirmed by the driver, all affected teachers get notified:

### Notification Content

```
🚌 School Trip Alert

Bus #3 (UBA 123K) — P.5 Museum Visit
Departing: Fri 8:00 AM

Kids on this bus:
1. Faith Akol — P.5A
2. Joseph Ssempijja — P.5A
3. Nakato Sarah — P.5A
... (34 total)

📍 Track live: [link]

Prepare these kids at the assembly point.
```

### Delivery Channels

| Channel | When |
|---|---|
| **App notification** | Immediately on confirmation |
| **WhatsApp** | If teacher has WhatsApp connected |
| **SMS** | Fallback for feature phone teachers |

### What Teachers Do

Teachers use this info to:
- Call out specific kids at assembly
- Load them onto the correct bus
- Do a headcount before departure
- Know which bus number to call if a kid is missing

---

## 8. Parent Notifications

When a trip is confirmed, the parent of each assigned kid gets notified:

### Notification Content

```
🚌 School Trip Notice

Your child, Faith Akol (P.5A),
is going on a school trip:

📍 P.5 Museum Visit — Uganda Museum
🚌 Bus #5 (UBA 456L)
🕐 Departing: Fri, Aug 14 at 8:00 AM
🕐 Returning: ~4:00 PM

📍 Track the bus live: [link]
⏱ Speed & location monitoring active

Have Faith at school by 7:30 AM.
```

### Delivery Channels

| Channel | When |
|---|---|
| **App notification** | Immediately on confirmation + morning of trip |
| **SMS** | Feature phone parents (SMS command handler) |
| **WhatsApp** | If parent has WhatsApp connected |

---

## 9. Live Tracking & Speed Monitoring

### Who Can Track

| Role | Can See |
|---|---|
| **School Admin** | All buses on one dashboard (map + speed per bus) |
| **Teachers** | Their assigned bus's location + speed |
| **Parents** | Only their kid's bus location + speed |

### Tracking Features

- Real-time GPS location of the bus
- **Speed display** (km/h) — peace of mind for parents
- Route path shown on map
- ETA to destination and return to school
- Bus stops along the route (if any)

### Speed Monitoring

- Dashboard shows current speed for each bus
- Speed alerts if bus exceeds a threshold (configurable by school)
- Admin gets notified if any bus in their fleet is speeding

### Technical Implementation

Reuse/extend the existing WebSocket tracking service (`backend/services/trackingService.js`):

```js
// New: Trip tracking session
const tripTrackingSchema = new mongoose.Schema({
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolTrip' },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  subscribers: [{
    role: String,               // 'admin' | 'teacher' | 'parent'
    userId: mongoose.Schema.Types.ObjectId,
    // Parents subscribe automatically when their kid is on the trip
  }],
  locationHistory: [{
    lat: Number,
    lng: Number,
    speed: Number,
    timestamp: { type: Date, default: Date.now },
  }],
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
});
```

---

## 10. Capacity Enforcement

### Rules

1. **Admin cannot assign more kids** than the vehicle's registered capacity
2. UI shows real-time count: `"34 assigned / 50 seats"`
3. Submit button disabled when `assigned >= capacity`
4. Driver's registered capacity is the hard limit — no override

### Edge Cases

| Scenario | Behavior |
|---|---|
| Admin tries to add 51st kid to 50-seat bus | Rejected — "Bus capacity exceeded (50 seats)" |
| Driver upgrades to bigger bus | Admin can reassign vehicle and adjust capacity |
| Some kids drop out before trip | Admin removes them, frees up seats for others |
| Last-minute addition | Only if seats remain — admin adds from dashboard |

---

## 11. School Admin Dashboard

### New "Trips" Section

```
┌──────────────────────────────────────────────────────┐
│  🚌 Trips                                            │
│                                                      │
│  [➕ Create New Trip]    [🚌 My Fleet]               │
│                                                      │
│  ┌───────────── Active Trips ──────────────────────┐ │
│  │ P.5 Museum Visit — Aug 14                        │ │
│  │ 🟢 In Progress — 34 kids — Bus #3 (UBA 123K)    │ │
│  │ [📍 View on Map] [📋 Kid List]                  │ │
│  ├──────────────────────────────────────────────────┤ │
│  │ P.7 Camping Trip — Sep 2                         │ │
│  │ ⏳ Confirmed — 28 kids — Bus #5 (UBB 789K)      │ │
│  │ [📋 Kid List]                                    │ │
│  └──────────────────────────────────────────────────┘ │
│                                                      │
│  ┌───────────── Upcoming Trips ────────────────────┐ │
│  │ S.1 Science Expo — Sep 15 — 0/50 seats — Draft  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                      │
│  ┌───────────── Completed ─────────────────────────┐ │
│  │ P.4 Zoo Trip — Jul 20 — ✅ 40 kids               │ │
│  └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### Live Tracking Dashboard (During Trip)

```
┌──────────────────────────────────────────────────────┐
│  📍 Live Buses                                        │
│                                                      │
│  ┌──────────────────────────────────────┐            │
│  │  🗺 Map showing all active buses      │            │
│  │                                      │            │
│  │  Bus #3 ●───▶───▶───▶  Museum        │            │
│  │  Bus #5 ●──────▶───▶  Zoo            │            │
│  └──────────────────────────────────────┘            │
│                                                      │
│  Bus #3 (UBA 123K) — P.5 Museum Trip                │
│  🟢 Speed: 45 km/h    ⏱ ETA: 15 min                 │
│  📊 Driver: John Okello    👦 34 kids                │
│                                                      │
│  Bus #5 (UBB 789K) — P.7 Camping                    │
│  🟢 Speed: 52 km/h    ⏱ ETA: 1h 20min               │
│  📊 Driver: Sarah Nakato    👦 28 kids               │
└──────────────────────────────────────────────────────┘
```

---

## 12. Database Schema Changes

### Files Modified

| File | Change |
|---|---|
| `backend/database/schema.js` | Add `taxi`, `bus` to vehicle type enum. Add `owner` + `ownerModel` to vehicleSchema. New `SchoolTrip` model. New `TripTracking` model (optional — can reuse existing tracking) |

### New Model: SchoolTrip

Full schema defined in [Section 2](#2-school-trip-model) above.

### Vehicle Schema Changes

```js
const vehicleSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // NEW fields:
  owner: { type: mongoose.Schema.Types.ObjectId, refPath: 'ownerModel' },
  ownerModel: { type: String, enum: ['User', 'School'] },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' }, // for fleet vehicles

  type: { type: String, enum: ['car', 'boda', 'taxi', 'bus'], required: true },
  registrationNumber: { type: String },
  capacity: { type: Number, default: 4 },   // taxi=14, bus=up to 60
  // ... existing fields
});
```

---

## 13. API Endpoints

### Trip Management (School Admin)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/trips` | Create a new school trip |
| `GET` | `/api/trips` | List trips (filterable by school, status, date) |
| `GET` | `/api/trips/:id` | Get trip details + assigned kids |
| `PATCH` | `/api/trips/:id` | Update trip (name, destination, time) |
| `DELETE` | `/api/trips/:id` | Cancel/delete a trip |
| `POST` | `/api/trips/:id/assign` | Assign kids to the trip |
| `POST` | `/api/trips/:id/remove-child` | Remove a child from the trip |
| `POST` | `/api/trips/:id/assign-vehicle` | Assign/change vehicle |

### Driver Actions

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/trips/driver` | Get trips assigned to this driver |
| `POST` | `/api/trips/:id/confirm` | Driver confirms the trip |
| `POST` | `/api/trips/:id/decline` | Driver declines the trip |
| `POST` | `/api/trips/:id/start` | Driver starts the trip (tracking begins) |
| `POST` | `/api/trips/:id/complete` | Driver completes the trip |

### Fleet Management

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/schools/:id/fleet` | List school's fleet vehicles |
| `POST` | `/api/schools/:id/fleet` | Add a vehicle to school fleet |
| `DELETE` | `/api/schools/:id/fleet/:vehicleId` | Remove vehicle from fleet |

### Tracking

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/trips/:id/tracking` | Get live tracking data for a trip |
| `WS` | `/ws/tracking/trip/:tripId` | WebSocket for real-time location updates (driver → server → subscribers) |

---

## 14. Mobile Screen Changes

### New Screens

| Screen | Who | What |
|---|---|---|
| **Trip Creation** | School Admin | Form to create trip, assign vehicle, assign kids |
| **Trip Details** | School Admin | View trip info, kid list, tracking map |
| **My Fleet** | School Admin | Manage school's bus fleet |
| **Trip Request** | Driver | Incoming trip notification, confirm/decline |
| **Trip Passenger List** | Driver | See all assigned kids on the trip |
| **Active Trip Tracking** | Driver | GPS streaming during trip |
| **Trip Monitoring** | Teacher | See bus info, kid list, live tracking |
| **Kid on Trip** | Parent | "Faith is on Bus #3" — track live |

### Existing Screens to Modify

| Screen | Change |
|---|---|
| **School Admin Dashboard** | Add "Trips" tab + "My Fleet" section |
| **Driver Dashboard** | Show trip requests alongside regular ride requests |
| **Driver Ride Hailing** | Add taxi/bus as vehicle types for individual bookings |
| **Parent Home** | Show trip notification card when kid is on a school trip |

---

## Implementation Priority

### Phase 1 — Foundation
1. Update vehicle type enum: `['car', 'boda', 'taxi', 'bus']`
2. Add `owner`/`ownerModel` to Vehicle schema
3. Create SchoolTrip model
4. Basic CRUD API: `/api/trips`
5. School admin can create a trip and assign kids (no driver confirmation yet)

### Phase 2 — Driver Flow
6. Driver trip request screen (app notification + confirm/decline)
7. Driver confirmation API
8. Driver sees kid list on their app

### Phase 3 — Notifications
9. Teacher notifications (app + WhatsApp + SMS)
10. Parent notifications (app + SMS + WhatsApp)

### Phase 4 — Tracking
11. Trip tracking via WebSocket
12. Admin dashboard with live map
13. Teacher + parent tracking views
14. Speed monitoring + alerts

### Phase 5 — Fleet Management
15. School fleet registration dashboard
16. "My Fleet" management screens
17. Fleet vehicle assignment in trip creation

---

## Open Questions for Hassan

1. **Pricing for external taxis/buses** — flat rate per trip, per kid, or school negotiates directly with the driver?
2. **Parent payment** — does the school collect trip fees from parents and pay the driver, or do parents pay directly?
3. **SMS for feature phone parents** — should the `SICK` SMS command also handle trip opt-out ("Faith can't go on the trip")?
4. **Teacher assignment** — does each bus need a specific teacher assigned to ride with the kids?
5. **Multiple buses for one trip** — if a trip needs 3 buses (180 kids), is that 3 separate trips or 1 trip with 3 vehicles?
6. **Recurring trips** — some schools have weekly sports days (every Friday). Should trips support recurring schedules?
