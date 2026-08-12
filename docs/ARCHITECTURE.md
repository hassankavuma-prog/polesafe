# PoleSafe Architecture

## Overview
PoleSafe is a school transport safety platform for Uganda. It coordinates parents, drivers, schools, and operators around safe ride booking, live tracking, pickup verification, incidents, and payment flows.

The system is designed for:
- low-bandwidth mobile use
- cheap phones and older Android devices
- calm, simple, operator-friendly workflows
- privacy-first handling of safety data

## Product Areas
- **Parent app**: booking, trip tracking, sick day flow, early pickup, pickup words, recurring schedules
- **Driver app**: route workflow, pickup/drop status, earnings, safety checks
- **School/admin tools**: attendance, gate checks, classroom handover, dispatcher triage
- **Safety Ops**: SOS incidents, incident review, masking/unmasking, audit trail, escalation
- **Payments**: MoMo, card, credits, and billing flows

## Frontend
### Mobile
- React Native app in `mobile/`
- Shared screen registry in `mobile/PoleSafeApp.js`
- Screens are organized by role and use plain JS for compatibility
- Offline resilience uses AsyncStorage-backed buffering for SOS and location pings

### Web Ops Console
- Next.js App Router page in `app/(ops)/safety/page.tsx`
- Uses `lib/safety-ops/` for schema and action contracts
- Dispatcher UI stays minimal and masked by default

## Backend
- Express backend in `backend/`
- MongoDB models and schemas in `backend/database/schema.js`
- Route modules in `backend/routes/`
- Safety incident handling in `backend/routes/safety.js`
- Recurring ride scheduling support in `backend/services/recurringRideService.js`

## Safety Data Model
Primary safety objects:
- `SafetyIncident`
- `AuditLog`
- ride/child/driver references
- contact relay entries

Safety incidents are masked by default. Sensitive fields like coordinates, location labels, and identifiers should only be revealed through verified dispatcher flow.

## Offline and Low-Bandwidth Strategy
- queue critical mobile events locally
- retry with backoff
- avoid hard failure when socket or network drops
- prefer small payloads and bounded queue sizes
- reconnect Socket.io where available, then fall back to HTTP

## Privacy and Audit
Safety Ops must follow these rules:
- redact sensitive information by default
- unmask only when permissions are verified
- write audit logs for access and changes
- keep operator actions traceable
- avoid overexposing location or identity data

## Key Paths
- `backend/routes/safety.js`
- `backend/database/schema.js`
- `backend/routes/parents.js`
- `backend/services/recurringRideService.js`
- `mobile/PoleSafeApp.js`
- `mobile/services/offlineSyncService.js`
- `mobile/services/TrackingClient.js`
- `mobile/services/tracking.js`
- `mobile/components/SOSButton.js`
- `mobile/screens/ParentTrack.js`
- `app/(ops)/safety/page.tsx`
- `lib/safety-ops/schemas.ts`
- `lib/safety-ops/actions.ts`
- `lib/safety-ops/types.ts`

## Current Direction
PoleSafe is evolving from a ride-booking app into a broader safety and operations platform, but the next layers should be built one clean step at a time:
- stabilize safety operations
- keep privacy controls strict
- keep offline handling simple
- keep the operator experience calm and usable
- avoid overbuilding admin features too early
