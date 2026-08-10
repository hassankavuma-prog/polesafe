# PoleSafe Driver System — Complete Specification
**Version:** 1.0  
**Date:** August 10, 2026  
**Status:** Final — Ready for Development

---

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Driver Availability Toggle](#2-driver-availability-toggle)
3. [Notification & Reminder System](#3-notification--reminder-system)
4. [Auto-Reassignment (Missed Ride Handling)](#4-auto-reassignment)
5. [Favorite Driver System](#5-favorite-driver-system)
6. [Rating-Priority Geo-Matching](#6-rating-priority-geo-matching)
7. [Three-Strike Reliability System](#7-three-strike-reliability-system)
8. [Driver Score Formula](#8-driver-score-formula)
9. [Term vs One-Off Booking Differences](#9-term-vs-one-off-booking-differences)
10. [App UI Screens](#10-app-ui-screens)
11. [Database Schema Changes](#11-database-schema-changes)
12. [Edge Cases & Questions](#12-edge-cases--questions)

---

## 1. System Overview

This system handles **driver scheduling, reliability, and matching** for PoleSafe. It covers three types of rides:

| Ride Type | Description | Assignment Method |
|---|---|---|
| **Scheduled School Rides** | Weekly/recurring term bookings (e.g., Mon-Fri 7 AM) | Favorite driver → Geo-rating pool |
| **One-off Bookings** | Single parent-scheduled ride | Favorite driver → Geo-rating pool |
| **Ride-Hailing** | On-demand, immediate | First available in geo-range |

> **Vehicle diversity:** This system treats all vehicle types equally — cars and boda bodas. No vehicle type gets priority over another in matching. A parent can filter by vehicle preference during booking.

**Core principles:**
- Reliability is tracked **per-booking**, not per-driver
- Rating & matching priority is global (Driver Score)
- Term bookings get extended offer windows
- Three misses on a booking → driver loses THAT booking only (see [Fairness Protections](#13-fairness-protections) for excused misses and sick days)
- 10 consecutive clean rides OR 3 weeks without a miss resets a booking's strike counter

---

## 2. Driver Availability Toggle

### Flow

```
Driver opens app
       │
       ▼
Get current availability from API (GET /api/drivers/availability)
       │
       ▼
Display toggle state:
  🟢 Available → Green background
  🔴 Offline   → Red background
       │
       ▼
Driver taps toggle:
  │
  ├── Call POST /api/drivers/availability { isAvailable: true/false }
  ├── Update server state
  └── Update UI
```

### API Endpoints

```
GET  /api/drivers/availability
     Response: { isAvailable: boolean }

POST /api/drivers/availability
     Body: { isAvailable: boolean }
     Response: { isAvailable, message }
```

### Toggle Behavior Rules

| Condition | Result |
|---|---|
| Driver has no upcoming school rides | Toggle works freely — go online anytime |
| Driver has upcoming school ride in < 30 min | **Auto-enabled** — driver is online for school ride |
| Driver is on gap between school rides | Toggle works — can accept ride-hailing |
| Driver has 3 strikes on a booking | **Can still toggle** — can do ride-hailing, NOT scheduled rides |
| Driver suspended (3+ misses) | **Can still toggle** for ride-hailing only |

### States on the Toggle

```
🟢 Available — Accepting ride-hailing and scheduled rides
🔴 Offline — Not accepting anything
🟡 Online for school rides only — Between rides, not accepting ride-hailing
🚫 Suspended — Can do ride-hailing only (scheduled rides revoked)
```

---

## 3. Notification & Reminder System

### Timeline for a Scheduled Pickup

```
T-60 min ──────────────────────────────────────────────────── T-0
    │                           │                              │
    ▼                           ▼                              ▼
Push notification           Push notification              Pickup
"Pickup Reminder"          "⚠️ Go Online or                 time
                            Ride Reassigned"
```

### Notification Schedule

| Time | Channel | Message | Target |
|---|---|---|---|
| **T-60 min** | Push + WhatsApp | "🚸 Your pickup for Faith Nakato is at 7:00 AM" | Smartphone drivers |
| **T-60 min** | SMS | "PoleSafe: Faith Nakato pickup 7:00AM. Go online by 6:30AM or ride reassigned. -PoleSafe" | Feature phone drivers |
| **T-30 min** | Push + WhatsApp | "⚠️ 30 min to pickup. Tap to go online now or your ride will be reassigned." | Smartphone drivers |
| **T-30 min** | SMS | "⚠️ 30MIN NOTICE: Go online now or Faith Nakato ride reassigned. -PoleSafe" | Feature phone drivers |
| **T-25 min** | Push + WhatsApp | "❌ Ride reassigned to another driver. Contact support if this was an error." | Only if driver didn't go online |
| **T-0** | Push + WhatsApp | "✅ Faith Nakato picked up by Ibrahim Kato" | Original driver (FYI) |

### Notification Precedence

```
Smartphone driver:  In-app push → WhatsApp → SMS (fallback)
Feature phone:      SMS → Voice call (for critical T-30 only if available)
```

Reminder sounds should be distinct:
- T-60: Normal notification sound
- T-30: Urgent/long vibration pattern (distinct from normal)

---

## 4. Auto-Reassignment

### Trigger Condition

A ride is auto-reassigned when:
- Driver has **not gone online** by **T-30 minutes** (30 min before first scheduled pickup)
- OR driver is online but **not moving toward pickup** by T-15 minutes

### Reassignment Flow

```
T-30: Check driver availability
       │
       ├── Online ✅ → Proceed normally. Driver executes ride.
       │
       └── Offline ❌
              │
              ▼
        1. Mark ride as "missed" for original driver
              │
              ▼
        2. Record strike against this booking
              │
              ▼
        3. Find replacement driver:
              │
              ├── a. Check if parent has favorite driver who IS online
              ├── b. If favorite declined/unavailable → Geo-rating pool
              ├── c. Offer to top-rated available driver in area
              └── d. 45 second window to accept (cascading)
              │
              ▼
        4. Replacement found? 
              │
              ├── YES → Assign to new driver, notify parent
              └── NO  → Notify parent: No drivers available.
                          Offer: Cancel and use Ride-Hailing instead
```

### What Happens to the Original Driver

```
┌──────────────────────────────────────┐
│  Original driver (Paul):             │
│                                      │
│  1. Ride marked as "reassigned"      │
│     for that day                     │
│  2. Strike added to booking counter  │
│  3. Rating drops -0.5               │
│  4. Notified via push                │
│  5. Still owns the booking           │
│     (unless 3 strikes reached)       │
└──────────────────────────────────────┘
```

### Temp Driver Payout

The temporary driver who covers a missed ride gets paid the **full driver payout** for that trip. The original driver gets **nothing** for that day's trip. This incentivizes drivers not to miss.

---

## 5. Favorite Driver System

### Overview (Lyft-style)

Parents can mark **one driver** as their favorite. That driver gets **first offer** on all future rides from that parent.

### Parent Flow

```
Parent's Past Rides / Driver List
       │
       ▼
┌──────────────────────────────────┐
│   ⭐ Your Drivers               │
│                                  │
│   Paul Ssempijja                 │
│   4.8 ★★★★★ · 12 trips         │
│   [⭐ FAVORITE]                  │
│                                  │
│   Ibrahim Kato                   │
│   4.2 ★★★★☆ · 3 trips          │
│   [☆ Set as Favorite]            │
│                                  │
│   Tap favorite button to set/chg│
└──────────────────────────────────┘
```

### Assignment Flow When Favorite Exists

```
Parent schedules ride
       │
       ▼
  ┌──────────────────────┐
  │ Favorite driver gets │
  │ FIRST OFFER          │
  └──────────┬───────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
  Offer window     Offer expires
  (varies by          │
  booking type)       │
    │                 ▼
    │           Ride offered to
    │           general pool
    │           (Geo + Rating)
    │
    ▼
Driver Accepts?
    │
  ┌─┴──┐
 YES   NO
  │      └──→ General pool
  ▼
Assigned + Parent notified
```

### Offer Windows by Booking Type

| Booking Type | Favorite Offer Window | Rationale |
|---|---|---|
| **Term booking** (3+ months) | **24 hours** | Driver needs time to review route commitment |
| **Monthly booking** | **12 hours** | Significant commitment |
| **Weekly booking** | **6 hours** | Moderate commitment |
| **One-off (days ahead)** | **30 minutes** | Fair time to respond |
| **Same-day booking** | **5 minutes** | Quick turn needed |

### When Favorite Driver Declines

- Parent is notified: "Paul declined. Finding the best available driver."
- Parent can choose to **keep Paul as favorite** (he might accept next time)
- OR parent can **remove Paul as favorite** if he keeps declining

### Favorite Status Auto-Review

If a favorite driver **declines 3 offers in a row** from the same parent:
- System flags it: "Your favorite driver has been unavailable for recent rides"
- App shows prompt: "Would you like to choose a new favorite driver?"
- Driver is not automatically removed, but parent is nudged

### Favorite Driver Notifications

When a parent sets a driver as favorite:
```
TO DRIVER: ⭐ "Sarah Nakato set you as their favorite driver!"
            "You'll get first offer on their future ride requests."
```

When a ride offer is sent to favorite driver:
```
TO DRIVER: ⭐ "Sarah Nakato needs a ride for Faith (P.3)"
            "Mon-Fri · Term 3 · 7:00 AM"
            "Tap to accept. Auto-declines in 24 hours."
            [✅ Accept] [❌ Decline]
```

---

## 6. Rating-Priority Geo-Matching

### The General Pool (G-Pool)

When a ride goes to the general pool (either no favorite, or favorite declined), drivers are matched using this priority order:

### Step 1: Geo-Filter

Find all drivers who are:
- Within **3km of pickup location**
- Currently **available** (toggled online)
- **Not currently on an active ride** (en_route, picked_up)
- **Not suspended** (≤ 2 strikes on any booking)

### Step 2: Sort by Driver Score

```
┌─────────────────────────────────────────────────────────────┐
│ Driver            Rating   Streak   Score    Offer Priority │
├─────────────────────────────────────────────────────────────┤
│ Paul Ssempijja    4.8      10       4.72     🥇 First      │
│ Ibrahim Kato      4.2      5        3.78     🥈 Second     │
│ New Driver        4.0      0        3.40     🥉 Third      │
│ Suspended (3+)    3.5      -        N/A      🚫 Excluded   │
└─────────────────────────────────────────────────────────────┘
```

### Step 3: Cascading Offer

```
Paul offered ride (45 seconds)
       │
       ├── Accepts ✅ → Assigned
       │
       └── Declines/Timeout
              │
              ▼
       Ibrahim offered ride (45 seconds)
              │
              ├── Accepts ✅ → Assigned
              │
              └── Declines/Timeout
                     │
                     ▼
              New Driver offered ride (45 seconds)
                     │
                     ├── Accepts ✅ → Assigned
                     │
                     └── Declines/Timeout
                            │
                            ▼
                     No driver found
                     Notify parent
```

### What the Driver Sees (Offer Screen)

```
┌──────────────────────────────────────┐
│      🚸 NEW RIDE OFFER               │
│                                      │
│   Faith Nakato → St. Mary's          │
│   P.3 · 3.2 km from you              │
│                                      │
│   7:00 AM pickup                     │
│   Today (Mon)                        │
│                                      │
│   Estimated: 5,000 UGX               │
│                                      │
│        [✅ Accept]                    │
│        Auto-decline in 45s           │
│                                      │
│   ⏱️ 00:32 remaining                │
│                                      │
│   ┌────────────────────┐             │
│   │ ⭐ Sarah Nakato    │             │
│   │ (Your favorite!)   │             │
│   └────────────────────┘             │
└──────────────────────────────────────┘
```

---

## 7. Three-Strike Reliability System

### Per-Booking Strikes

Each booking (term, weekly, or one-off) has its **own strike counter**. A driver who misses Faith's rides but handles Grace's rides perfectly only loses Faith's booking.

### What Counts as a Miss

| Event | Miss? | Notes |
|---|---|---|
| Driver not online by T-30 | ✅ **Yes** | Auto-detected |
| Driver goes online at T-10 (too late) | ✅ **Yes** | Ride already reassigned |
| Driver cancels < 2 hours before | ✅ **Yes** | Same as miss |
| Driver cancels ≥ 2 hours before | ❌ **No** | "Excused" — doesn't count as strike |
| Driver reports sick ≥ 2 hours before | ❌ **No** | Excused |
| Driver reports car breakdown | ❌ **No** | Excused (support verifies) |
| Driver is online but stalled (not moving) at T-15 | ✅ **Yes** | Auto-detected via GPS |

### Strike Progression

```
Booking created (0 strikes)
       │
       ▼
┌──────────────────────────────────────┐
│  First Miss                          │
│  Warning: "⚠️ 2 attempts remaining"  │
│  Rating drops -0.5                   │
│  Temp driver covers today            │
└──────────────┬───────────────────────┘
               ▼
┌──────────────────────────────────────┐
│  Second Miss                         │
│  Warning: "🚨 1 attempt remaining"   │
│  Rating drops -0.5                   │
│  Banner appears on app               │
└──────────────┬───────────────────────┘
               ▼
┌──────────────────────────────────────┐
│  Third Miss                          │
│  🚫 BOOKING SUSPENDED               │
│  Driver loses THIS booking only      │
│  Booking reassigned to new driver    │
│  Driver must contact support         │
└──────────────────────────────────────┘
```

### Strike Reset (10 Rides OR 3 Weeks Clean)

If a driver completes **10 consecutive scheduled rides without a miss** on a specific booking:
- That booking's strike counter **resets to 0**
- Rating recovers +0.1
- Warning banners disappear
- Driver is notified: "✅ Record cleared! Your strike counter is reset."

The counter should persist across days. A driver who does 5 rides one week and 5 the next → reset triggers on the 10th clean ride.

**Alternative reset for part-time drivers:** If a driver works fewer days (e.g., 3 rides/week instead of 5), the counter also resets after **3 consecutive weeks (21 days) with zero misses** on that booking — whichever comes first, 10 rides or 3 weeks. This prevents part-time drivers from needing months to clear their record.

### What's Displayed to the Driver

**Normal (clean record):**
```
│  🟢 Good Standing                     │
│  0 missed rides · 10 ride streak     │
```

**1 Miss:**
```
│  ⚠️  2 ATTEMPTS REMAINING             │
│  Next miss: Ride may be reassigned   │
│  ████████░░  8/10 clean rides        │
```

**2 Misses (final warning):**
```
│  🚨  1 ATTEMPT REMAINING              │
│  ⚡ Priority: LOW                     │
│  ████░░░░░░  4/10 clean rides        │
│  ONE MORE MISS = BOOKING LOST        │
```

**3 Misses (suspended):**
```
│  🚫  BOOKING SUSPENDED                │
│  This route has been reassigned.      │
│  📞 Contact Support to appeal         │
```

---

## 8. Driver Score Formula

### Calculation

```
Driver Score = (Rating × 0.4) + (CleanStreak × 0.3) + (TotalRides × 0.2) - (ActiveMisses × 0.1)
```

Where:
- **Rating**: Driver's star rating (0.0 – 5.0)
- **CleanStreak**: Current number of consecutive clean rides across ALL bookings (0+)
- **TotalRides**: Total completed rides lifetime (capped at 100 for score purposes)
- **ActiveMisses**: Total active misses across ALL bookings (not yet reset by clean streak)

### New Driver Boost

New drivers start at a natural disadvantage (0 rides, 0 streak = low score). Without a boost, they'd never get offered a ride because higher-rated drivers always win.

- **First 10 rides**: New drivers get priority matching (treated as Score ≥ 4.0 regardless of actual score)
- This gives them a chance to build a reputation and earn ratings
- After 10 rides, normal scoring applies
- A driver leaves "New Driver" status after completing 10 rides OR 2 weeks on the platform, whichever comes first

### Example Scores

| Driver | Vehicle | Rating | Streak | Rides | Misses | Score | Priority |
|---|---|---|---|---|---|---|---|
| Paul | **Car** | 4.8 | 10 | 85 | 0 | **4.72** | 🥇 Highest |
| Ibrahim | **Boda** | 4.2 | 5 | 40 | 1 | **3.98** | 🥈 High |
| Grace | **Car** | 4.5 | 0 | 5 | 0 | **2.80** | 🥉 Medium |
| John (new) | **Car** | 4.0 | 0 | 0 | 0 | *1.60* → **Boosted** | 🥇 Boosted |
| Tom (suspended) | **Boda** | 3.5 | 0 | 50 | 3 | **2.10** | 🚫 Blocked |

> **Vehicle neutrality:** The Driver Score is completely vehicle-agnostic. A boda driver with 4.8 rating gets the same matching priority as a car driver with 4.8 rating. Parents can filter by vehicle type during booking, but the matching algorithm does not favor any vehicle type.

### Score Effect on Matching

| Score Range | Priority | Effect |
|---|---|---|
| 4.0+ | 🥇 High | First offers, priority for new assignments |
| 3.0 – 3.99 | 🥈 Medium | Standard matching |
| 2.0 – 2.99 | 🥉 Low | Receives offers only after higher-rated drivers pass |
| < 2.0 | 🚫 Blocked | Not eligible for scheduled ride offers |

### Rating Changes Per Event

| Event | Rating Change |
|---|---|
| Complete ride | +0.0 (no change; rating is recalculated periodically) |
| Miss ride (not online by T-30) | **-0.5** |
| Cancel < 2h before | **-0.5** |
| Cancel ≥ 2h before | -0.1 (minor) |
| 10 consecutive clean rides | **+0.1** |
| Parent gives 5-star rating | +0.05 |
| Parent gives 1-star rating | -0.2 |

---

## 9. Term vs One-Off Booking Differences

### Comparison Table

| Feature | One-Off Ride | Weekly Booking | Term Booking (3+ months) |
|---|---|---|---|
| **Favorite offer window** | 5 min (same-day) / 30 min (advance) | 6 hours | **24 hours** |
| **Assignment type** | Single ride | Recurring weekly | **Recurring commitment** |
| **Miss consequence** | Lose that ride + strike | **Temp covers day + strike** | **Temp covers day + strike** |
| **After 3 misses** | Lose future single rides | Lose THAT weekly booking | **Lose THAT term booking** |
| **Strike reset** | 10 clean single rides | 10 clean weekly rides | 10 clean daily rides (~2 weeks) |
| **Rating impact per miss** | -0.5 | Same | Same |
| **Bonuses** | None | None | **+10% term commitment bonus** |

### Daily Fallback for Recurring Bookings

This is the most important piece for recurring bookings:

```
6:30 AM (T-30 for 7:00 AM pickup)
       │
       ▼
Check: Is Paul online?
       │
       ├── YES → Proceed normally. Paul takes the ride.
       │
       └── NO  → 
              │
              ▼
         1. Mark today as "missed" for Paul on THIS booking
         2. Record strike against the booking
         3. Find TEMP driver for TODAY ONLY
         4. Temp driver does the pickup
         5. Paul STILL OWNS the booking for tomorrow
```

Key: Paul doesn't lose the whole term booking for one sick day. He just loses **that day** + gets a strike. The booking is still his tomorrow.

### When Temp Covers

The temp driver:
- Gets paid the full driver payout for that day's trip
- Shows up in the parent's app as "Today's Driver"  
- Does NOT take over the booking — it's a one-day cover
- Paul's name stays as the assigned driver for the booking long-term

### Parent Notification When Temp Covers

When Paul misses and a temp covers, the parent sees:

```
🚸 Today's Driver: Ibrahim Kato
─────────────────────────────
Paul is unavailable today.
Ibrahim will take Faith to school.

Ibrahim Kato ★★★★☆
Boda UDP 456Y · 3km away
ETA: 6:50 AM

[✔️ OK]   [Set as new favorite?]
```

---

## 10. App UI Screens

### Driver App — Dashboard (Normal)

```
┌──────────────────────────────────────┐
│         🟢 Available for Rides        │
│                                      │
│ ⭐ 4.8 ★★★★★  |  🏆 10 streak       │
│                                      │
│ 📅 Today's Route                     │
│  🌅 7:00 Faith Nakato    🟢 Done    │
│  🌅 7:15 Akol Nakato     🟡 En rout │
│  🕐 GAP: 7:30 → 15:30 (ride mode)   │
│  🌇 15:30 Faith Nakato  ⚪ Upcoming │
│  🌇 16:30 Akol Nakato   ⚪ Upcoming │
│                                      │
│ ┌──────────────────────────┐         │
│ │ ⭐ You're Sarah's        │         │
│ │   Favorite Driver!       │         │
│ └──────────────────────────┘         │
│                                      │
│ [🗺️ View Full Route]                 │
│ [💰 View Earnings]                   │
└──────────────────────────────────────┘
```

### Driver App — On Warning (1-2 Strikes)

```
┌──────────────────────────────────────┐
│  🟢 Available for Rides               │
│                                      │
│  ⚠️  2 ATTEMPTS REMAINING            │
│                                      │
│  One more miss on Sarah Nakato's     │
│  booking and you'll lose it.         │
│                                      │
│  ████████░░  8/10 clean rides        │
│                                      │
│  [📞 Contact Support]                │
│                                      │
│  ⚡ Priority: 🥈 Normal               │
└──────────────────────────────────────┘
```

### Driver App — Suspended (3 Strikes)

```
┌──────────────────────────────────────┐
│  🟢 Available for Rides               │
│  (Ride-Hailing Only)                 │
│                                      │
│  🚫 BOOKING SUSPENDED                │
│                                      │
│  You've missed 3 scheduled rides     │
│  for Sarah Nakato's booking.         │
│  This booking has been reassigned.   │
│                                      │
│  ✅ You can still accept Ride-       │
│     Hailing trips in the meantime.   │
│                                      │
│  To restore full access:             │
│  [📞 Contact Support]                │
│                                      │
│  ┌────────────────────────────┐      │
│  │ Or call +256 XXX XXX XXX   │      │
│  └────────────────────────────┘      │
└──────────────────────────────────────┘
```

### Parent App — Favorite Driver Selection

```
┌──────────────────────────────────────┐
│  ⭐ Your Drivers                     │
│                                      │
│  Drivers you've ridden with:         │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ Paul Ssempijja               │    │
│  │ ★★★★☆ 4.8                   │    │
│  │ 12 trips · Car UAR 123X      │    │
│  │ ✅ Your Favorite             │    │
│  │ [⭐ Change]                   │    │
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ Ibrahim Kato                 │    │
│  │ ★★★★☆ 4.2                   │    │
│  │ 3 trips · Boda UDP 456Y      │    │
│  │ [☆ Set as Favorite]          │    │
│  └──────────────────────────────┘    │
│                                      │
│  Note: Your favorite driver gets     │
│  first offer on your ride requests.  │
│  Set only one favorite at a time.    │
└──────────────────────────────────────┘
```

### Parent App — Booking Confirmation with Favorite

```
┌──────────────────────────────────────┐
│  Schedule a Ride                     │
│                                      │
│  Child: Faith Nakato (P.3)           │
│  School: St. Mary's                  │
│  Time: 7:00 AM                       │
│  Repeats: Mon-Fri                    │
│  Term: Term 3 (Aug – Dec)            │
│                                      │
│  ┌──────────────────────────┐        │
│  │ ⭐ Driver Preference     │        │
│  │                          │        │
│  │ Paul Ssempijja ★ 4.8    │        │
│  │ 12 trips · Your favorite │        │
│  │                          │        │
│  │ He'll get first offer    │        │
│  └──────────────────────────┘        │
│                                      │
│  Total: 450,000 UGX / term           │
│                                      │
│        [✅ Confirm Booking]           │
└──────────────────────────────────────┘
```

### Parent App — Driver Changed Notification

```
┌──────────────────────────────────────┐
│  🚸 TODAY'S DRIVER CHANGED           │
│                                      │
│  ⚠️ Paul Ssempijja is unavailable    │
│     today. We've assigned:           │
│                                      │
│  🏍️ Ibrahim Kato ★★★★☆              │
│  Boda UDP 456Y · ETA 6:50 AM         │
│                                      │
│  [✔️ Continue]                        │
│  [⭐ Make Ibrahim my favorite]        │
│  [✏️ Message Ibrahim]                │
└──────────────────────────────────────┘
```

---

## 11. Database Schema Changes

### Vehicle Schema — Add `isAvailable`

```javascript
// NEW FIELDS to Vehicle schema (database/schema.js)
isAvailable: { type: Boolean, default: false },
lastOnlineAt: { type: Date },         // When driver last toggled online
```

### Driver User Schema — Add Reliability Fields

```javascript
// NEW FIELDS to User schema (for driver role)
driverReliability: {
  // Per-booking strike tracking (references Booking._id)
  bookingStrikes: [{
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    strikes: { type: Number, default: 0 },
    cleanStreak: { type: Number, default: 0 },
    lastMissAt: { type: Date },
    suspendedAt: { type: Date },
    reinstatedAt: { type: Date },
    suspended: { type: Boolean, default: false },
  }],

  // Global stats
  totalMisses: { type: Number, default: 0 },
  totalExcusedMisses: { type: Number, default: 0 },
  totalSuspensions: { type: Number, default: 0 },
  currentGlobalStreak: { type: Number, default: 0 },  // Across all bookings
  longestStreak: { type: Number, default: 0 },

  // Rating
  rating: { type: Number, default: 4.5, min: 1, max: 5 },
  ratingHistory: [{
      rating: Number,
      byParent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      comment: String,
      date: { type: Date, default: Date.now },
  }],
},
```

### Booking Schema — Add Favorite Driver

```javascript
// NEW FIELDS to Booking schema
favoriteDriverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
favoriteDriverSetAt: { type: Date },
favoriteDriverDeclineCount: { type: Number, default: 0 },
lastFavoriteDeclineAt: { type: Date },
```

### Ride Schema — Add Miss Tracking

```javascript
// NEW FIELDS to Ride schema
isReassigned: { type: Boolean, default: false },
reassignedFromDriverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
reassignedToDriverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
reassignedAt: { type: Date },
missType: { type: String, enum: ['no_show', 'late_online', 'late_cancel', 'excused'] },
driverOnlineAt: { type: Date },         // When driver actually went online
```

### New Collections

```javascript
// DriverNotification — notification log
const driverNotificationSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  rideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride' },
  type: { type: String, enum: ['reminder_t60', 'reminder_t30', 'reassignment_alert',
                                'strike_warning', 'suspension', 'reinstatement',
                                'clean_streak_reset', 'favorite_driver_offer',
                                'favorite_declined', 'favorite_set'] },
  channel: { type: String, enum: ['push', 'whatsapp', 'sms', 'voice'] },
  message: String,
  sentAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  readAt: { type: Date },
});
```

---

## 12. Edge Cases & Questions

### Answered

| Question | Decision |
|---|---|
| **First miss free?** | No — every miss counts. But ≥2h notice = excused |
| **Ride-hailing misses count?** | No — only scheduled school rides |
| **Excused misses?** | Yes — driver who notifies ≥2h early gets excused (no strike) |
| **Per-booking or system-wide?** | **Per-booking.** Three misses = lose THAT booking only |
| **Strike reset conditions?** | 10 consecutive clean rides **OR** 3 weeks (21 days) with zero misses |
| **Support reinstatement flow?** | Support reviews case → can manually clear strikes |
| **SMS/voice for feature phone?** | Yes — SMS at T-60 and T-30. Voice for critical alerts if available |

### Open Questions for Hassan

1. **What happens when temp driver covers and the parent LOVES the temp?** Should they get a "Switch favorite to this driver?" prompt automatically? I think yes — but the original favorite driver should be notified.

2. **Favorite driver declines — should they lose favorite status after X declines?** Suggested: 3 consecutive declines from same parent triggers a "want to change favorite?" nudge, but doesn't auto-remove.

3. **Do driver strikes carry over to a new term?** If Paul had 2 strikes in Term 2, does Term 3 start fresh? I'd suggest **fresh start each term** — the strike counter is per-term, per-booking. Keeps it clean and gives drivers a reset.

4. **Should drivers see the parent's name when deciding to accept?** Critical for the favorite system to work — yes, they should see "Sarah Nakato" so they know it's their favorite family.

5. **Minimum driver count for auto-reassignment to work?** If there's only 1 driver in the area, auto-reassignment does nothing. Should there be a flag that tells parents "No backup drivers available in your area" during booking?

---

## Implementation Priority

| Phase | Items | Estimated Effort |
|---|---|---|
| **Phase 1 — Foundation** | Vehicle schema fix, availability API, driver dashboard toggle wiring | 1-2 days |
| **Phase 2 — Notification System** | Cron job for T-60/T-30 checks, push/WhatsApp/SMS integration, notification logs | 3-4 days |
| **Phase 3 — Auto-Reassignment** | T-30 online check, temp driver matching, cascading offers, parent notification | 4-5 days |
| **Phase 4 — Favorite Driver** | Parent selection UI, offer-first flow, decline handling, 24h term offers | 3-4 days |
| **Phase 5 — 3-Strike System** | Per-booking strike counting, 10-ride reset, suspension logic, support workflow | 3-4 days |
| **Phase 6 — Driver Score** | Score calculation, matching priority, rating effects, UI display | 2-3 days |
| **Phase 7 — Term Bookings** | Extended offer windows, daily fallback, temp covers, bonus pay | 3-4 days |
| **Total** | | **~21 days (3 weeks)** |

---

*End of specification. Questions or clarifications? Hassan, ping me.* 🚸

---

## 13. Fairness Protections

This section consolidates the **chosen fairness safeguards** — protections built into the system so drivers aren't treated unfairly. These were selected as the most critical from the broader list of potential fairness gaps.

| # | Protection | Why It Matters |
|---|---|---|
| 1 | **Driver sick days (2 per term)** | Reciprocity — parents get sick day credits, drivers should too. Malaria, family emergencies, illness are real. |
| 2 | **New Driver Boost (first 10 rides)** | Prevents a permanent elite class. Without it, new drivers can never get their first offer because high-rated drivers always win. |
| 3 | **Notification delivery tracking** | Uganda has real network gaps (MTN/Airtel dead zones). If both T-60 and T-30 notifications failed to deliver, the miss is excused. |
| 4 | **Alternative strike reset (10 rides OR 3 weeks)** | Fair to part-time drivers (3 rides/week vs 5). Not everyone works Mon-Fri. |
| 5 | **Sibling double-strike protection** | One pickup, one strike — even if collecting 3 siblings. Prevents strike multiplication for a single event. |
| 6 | **Vehicle type neutrality** | Car and boda — both treated equally by the matching algorithm. No vehicle type gets priority. |

---

### 13.1 Driver Sick Days (2 Per Term)

Drivers get **2 excused sick days per term** that do NOT count as strikes — same principle as parent sick day credits.

| Condition | Result |
|---|---|
| Driver notifies ≥ 2h before pickup | **Excused** — uses 1 sick day allowance, temp driver covers |
| Driver notifies < 2h before pickup | **Miss** — counts as strike (unless emergency verified by support) |
| Driver has no sick days remaining | **Strike applies** |
| Sick days unused at term end | Expire — do not roll over |

**Flow:**

```
Driver realizes they can't make pickup
       │
       ▼
Notifies system (≥2h before)
       │
       ▼
System checks: sick days remaining?
       │
       ├── YES (≥1) → Excused. Temp driver covers. 1 sick day deducted.
       └── NO (0)   → Strike applies. Driver warned.
```

---

### 13.2 New Driver Boost (First 10 Rides)

New drivers start at a natural disadvantage (0 rides, 0 streak = low score). They'd never get a first offer if competing against established drivers.

- **First 10 rides**: New drivers get priority matching — treated as Score ≥ 4.0 regardless of actual score
- After 10 rides, normal scoring kicks in
- A driver leaves "New Driver" status after completing 10 rides OR 2 weeks on the platform, whichever comes first

**Effect:**
```
John signs up (Rating: 4.0, Rides: 0, Score: 1.60)
       │
       ▼
Without boost: Never receives offers (Paul always wins)
With boost:    Gets first 10 offers priority → builds real rating
       │
       ▼
After 10 rides: Normal scoring. His score reflects real performance.
```

---

### 13.3 Notification Delivery Protection

If BOTH the T-60 and T-30 reminders **failed to deliver** to a driver (network down, phone off, dead zone), the resulting miss is **automatically excused** — no strike recorded.

**Rule:**
| T-60 delivered? | T-30 delivered? | Outcome |
|---|---|---|
| ✅ Yes | ✅ Yes | Strike if driver ignores |
| ✅ Yes | ❌ No | Strike — driver had T-60 notice |
| ❌ No | ✅ Yes | Strike — driver had T-30 notice |
| ❌ No | ❌ No | **Excused** — both failed to deliver |

Delivery success is logged in the `DriverNotification` collection (`sent: true/false`). Support can review logs during disputes.

---

### 13.4 Alternative Strike Reset (10 Rides OR 3 Weeks)

A strike counter resets when **either** condition is met — whatever comes first:

- **10 consecutive clean rides completed** on that booking, OR
- **3 consecutive weeks (21 days) with zero misses** on that booking

| Driver | Schedule | Time to clear 10 rides | Time to clear 3 weeks | Reset trigger |
|---|---|---|---|---|
| Paul | Mon-Fri (5 rides/week) | 2 weeks | 3 weeks | **10 rides wins** at 2 weeks |
| Ibrahim | Mon-Wed-Fri (3 rides/week) | 3.5 weeks | 3 weeks | **3 weeks wins** at 3 weeks |

This prevents drivers with fewer scheduled days from being penalized longer for the same number of strikes.

---

### 13.5 Sibling Protection

When a driver picks up multiple children from the same family on the same trip:

> **1 pickup miss = 1 strike total** — regardless of how many siblings were being picked up.

**Why:** If Sarah has 3 kids (Faith, Akol, Grace) and Paul misses the morning pickup, it was one event. It shouldn't count as 3 strikes just because 3 kids were in the car.

---

### 13.6 Vehicle Type Neutrality

The Driver Score, matching algorithm, and strike system treat **all approved vehicle types equally**:

| Vehicle Type | Score Weight | Matching Priority | Strike System | Payout Calculation |
|---|---|---|---|---|
| Car (sedan/SUV) | Standard | Standard | Standard | Standard rate |
| Boda boda (motorcycle) | Standard | Standard | Standard | Standard rate |
| Boda boda (motorcycle) | Standard | Standard | Standard | Standard rate |
| Any other approved type | Standard | Standard | Standard | Standard rate |

**What this means for drivers:**
- A boda driver with 4.8 rating gets the same matching priority as a car driver with 4.8 rating
- The algorithm does NOT prefer cars over bodas or vice versa
- **Parents** can optionally filter by vehicle type during booking (e.g., "Car only" for a child who needs a car seat), but the matching system itself is neutral
- A driver's vehicle type has zero impact on their strike count, suspension, or rating

**What this means for parents:**
- When booking, parent sees vehicle type of each driver
- Can filter: "Car only" / "Boda only" / "All types"
- Favorite driver can be any vehicle type — system doesn't restrict

---

*End of §13 Fairness Protections. Full spec: 13 sections, vehicle-agnostic, driver-first.* 🚸
