# PoleSafe Architecture Audit

**Date:** 2026-08-13 UTC
**Scope:** backend/, mobile/, lib/, database schemas
**Reviewer role:** Principal Software Architect & Senior Code Reviewer

## Verdict
PoleSafe is **architecturally on-track** and clearly beyond a standard ride-hailing app, but it is **not yet fully production-coherent**. The core roadmap is present in the codebase, but several pillars are still only partially wired end-to-end across schema, backend enforcement, and mobile UI.

## High-level assessment
- Strong school-admin and child-safety orientation
- Good payment and attendance primitives
- Strong groundwork for Uganda-specific workflow fit
- Remaining work is mostly in enforcement consistency, UI linkage, and cleanup of route/service ownership

---

## 1) Anti-Forgery & Onboarding Security

### Status
**Partial**

### What exists
- Driver vetting service exists: `backend/services/driverVettingService.js`
- AI/triage and compliance primitives exist in `lib/engine/hamnah-core.ts`
- Admin routes expose verification flows in `backend/routes/admin.js`
- Onboarding and document concepts exist in schema and route/service logic

### What is missing / incomplete
- No fully verified, repo-wide quarantine gate that blocks activation across every driver onboarding path
- AI anomaly detection is not proven to be uniformly enforced before driver activation
- Need consistent enforcement across upload, review, approval, and activation paths

### Priority fix order
1. Centralize driver document submission validation
2. Enforce AI quarantine before activation
3. Make approval/activation routes consume the same review contract
4. Add UI feedback for quarantine states

---

## 2) Child Safety Verification Protocols

### Status
**Mixed**

### What exists
- Safe-word fields in schema:
  - `safeWord`
  - `safeWordRevealedAt`
  - `safeWordVerified`
- Driver route now blocks safe-word reveal until arrival
- Driver UI copy was updated to reflect arrival-only reveal
- Child onboarding supports safe-word capture
- `safeWordPhoto` exists for young children
- `helmetProvided` exists in post-trip review / safety data

### What is missing / incomplete
- Vest/helmet photo-handoff is not yet confirmed as fully wired across ride activation and arrival views
- Safe-word flow is strong, but photo-handoff coverage still needs end-to-end confirmation
- Some safety fields exist in schema, but UI/state transitions are not fully unified

### Priority fix order
1. Confirm vest/helmet handoff in driver activation + arrival screens
2. Ensure safe-word and photo handoff share the same ride-state contract
3. Add clear driver-facing and parent-facing state feedback

---

## 3) Dual-Mode Account Switching

### Status
**Partial**

### What exists
- The app already has distinct mobility contexts and role-based screens
- Mobile routes and dashboards show separate school/parent/driver experiences
- Platform design clearly anticipates different account modes

### What is missing / incomplete
- No fully proven seamless toggle between Kids Mobility Account and Personal Ride Account across the whole app
- Mode switching is not yet verified to consistently affect:
  - route selection
  - wallet/payment state
  - history
  - notifications
  - safety rules

### Priority fix order
1. Define a single mode state contract
2. Wire mode state into API calls and navigation
3. Ensure mode-switch persists across sessions
4. Add explicit UI affordances and labels

---

## 4) School Admin OS & 200m Multi-Gate Geo-Fencing

### Status
**Mostly present, not yet fully hardened**

### What exists
- School admin routes in `backend/routes/schools.js`
- School approval logic in `backend/routes/admin.js`
- Gate pinning fields added to schema
- Gate matching helper added:
  - `lib/engine/gateGeofence.js`
- Gate pin route in `backend/routes/fleetContracts.js`
- School arrival/check-in flow now uses gate matching

### What is missing / incomplete
- Strict 200m geofence enforcement is present in helper logic, but not yet proven as the only path everywhere
- The “Pending until dispatcher physically maps gates” workflow is not fully verified as a locked state machine
- Some enforcement still depends on route discipline rather than a single central guard

### Priority fix order
1. Centralize school gate-approval state transitions
2. Ensure all gate-related routes use the same geofence helper
3. Lock approval until gate mapping is completed
4. Surface gate-pinning status in school UI

---

## 5) Universal Attendance & Broadcast Hub

### Status
**Strong backend foundation, partial frontend proof**

### What exists
- School dashboard and attendance reporting in `backend/routes/schools.js`
- Manual attendance for all kids, including non-PoleSafe children
- `backend/services/broadcastService.js` exists and routes announcements
- Attendance report and SMS broadcast flows are already present in the school layer
- Mobile screens for school/dashboard reporting exist

### What is missing / incomplete
- UI cohesion across school admin and teacher surfaces still needs final proof
- Teacher portal integration is not yet fully verified end-to-end
- Broadcast routing is present, but all channel fallbacks and admin surfaces need final consistency checks

### Priority fix order
1. Verify teacher-facing attendance workflows
2. Confirm broadcast routing and fallback behavior
3. Align dashboard wording and states across mobile/web
4. Ensure full attendance reporting consistency for all kids

---

## 6) Upfront Bundles, Staggered Bells & Virtual Staging

### Status
**Partial**

### What exists
- Payment rails and mobile money support exist in backend payment services
- Trip and ride routes exist with payment-related logic
- `lib/engine/dismissalEngine.js` exists
- `backend/routes/schools.js` now supports dismissal schedule save/check endpoints
- 500m staging-zone concept is represented in dismissal engine logic

### What is missing / incomplete
- Weekly/monthly/termly bundle enforcement before ride scheduling is not fully verified across all ride creation paths
- The 500m staging zone is not yet proven as a universal dispatch guard across all relevant state transitions
- Bell-based release logic needs final consistency across dispatch, arrival, and school admin workflows

### Priority fix order
1. Enforce bundle payment gating before scheduling
2. Apply dismissal staging checks in dispatch/arrival flows
3. Surface schedule + release state in school UI
4. Ensure all transport paths honor the same rules

---

## Orphan files / incomplete links / cleanup concerns

### Files added or introduced in the alignment pass
- `lib/engine/gateGeofence.js`
- `lib/engine/dismissalEngine.js`
- `backend/routes/fleetContracts.js`

### Current cleanup concern
- The repo had import-path drift around `hamnah-core` references; this has been normalized in the affected backend modules, but the project should keep one canonical import style going forward.

### Structural concern
- Several responsibilities are split across routes and services:
  - school admin logic
  - fleet/tour logic
  - attendance/broadcast logic
  - onboarding/compliance logic
  - safety verification logic

This is workable, but it must remain disciplined to avoid duplicated rules.

---

## Roadmap completeness summary

### Implemented or strongly present
- Safe-word schema and arrival-only reveal logic
- School attendance and broadcast backbone
- Gate pinning / gate geofence groundwork
- Dismissal schedule groundwork
- Fleet contract route scaffold
- Payment and mobile money backbone
- Driver vetting service foundation

### Partial
- Anti-forgery quarantine enforcement
- Vest/helmet handoff flow
- Dual-mode account switching
- End-to-end 200m geo-fencing enforcement
- Full bundle gating before scheduling
- Universal staging-zone enforcement

### Needs final verification
- Teacher portal and mobile UI consistency
- All mode-toggle flows
- End-to-end safety photo handoff
- Strict school gate state machine
- Bundle + bell + staging enforcement on every route

---

## Final conclusion
PoleSafe is **not merely a ride-hailing app**. It already has the shape of a **Uganda-first school mobility operating system** with safety, attendance, broadcast, geofencing, payment, and fleet-management primitives.

However, it is **not yet fully finished**. The architecture is right; the remaining work is to make the rules consistent everywhere, remove the last import/path drift, and finish UI-to-backend enforcement links so the system behaves as one coherent product.
