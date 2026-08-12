# PoleSafe Safety Ops Spec

## Purpose
Safety Ops is the incident and dispatcher command layer for PoleSafe. It exists to handle SOS alerts, triage incidents, protect sensitive data, and let verified operators act quickly without exposing more information than necessary.

## Goals
- receive and record SOS incidents
- keep incident details masked by default
- support verified unmasking for dispatcher triage
- log every sensitive access and action
- keep the interface simple and calm
- work on low-bandwidth connections
- avoid unnecessary admin complexity

## Non-Goals
- full security operations center analytics
- map-heavy command center dashboards
- broad enterprise governance suites
- complex automation before the core loop is stable
- exposing private incident details to unverified users

## Core Safety Rules
1. **Mask by default**
   - incident locations must be redacted unless explicitly unmasked through verified flow
   - sensitive identifiers should also be hidden in masked views

2. **Verify before reveal**
   - unmask actions require dispatcher/admin access
   - the system must record who requested the reveal and why

3. **Audit everything important**
   - incident creation
   - acknowledge
   - assign
   - escalate
   - resolve
   - mask
   - unmask
   - re-mask
   - incident views when relevant

4. **Keep the operator workflow short**
   - see incident
   - acknowledge
   - assign
   - escalate if needed
   - resolve when confirmed

## Incident Lifecycle
### 1. SOS Triggered
A parent, driver, teacher, or system event can create an incident.

### 2. Incident Recorded
The backend stores a `SafetyIncident` record with:
- incident number
- trigger type
- severity
- reporter role
- optional child/ride/school links
- optional live coordinates
- device status
- audit trail
- privacy mask flag

### 3. Masked Dispatch View
Dispatcher views should show:
- incident number
- severity
- status
- limited location label
- privacy state
- enough context to triage safely

### 4. Verified Unmask
A verified dispatcher can request reveal of sensitive fields. The system must:
- check role/permission
- log the attempt
- unmask only the specific incident view or record
- allow re-masking after triage if needed

### 5. Resolve or Close
When the incident is handled, the operator can resolve or mark false alarm, with a note and audit trail.

## Backend Requirements
The backend safety routes should provide:
- `POST /sos`
- `GET /sos/active`
- `GET /incidents`
- `GET /incidents/:id`
- `POST /incidents/:id/unmask`
- `POST /incidents/:id/re-mask`
- `POST /sos/acknowledge`
- `POST /sos/resolve`
- `PATCH /incidents/:id/assign`
- `PATCH /incidents/:id/escalate`
- `PATCH /incidents/:id/mask`

## Redaction Policy
Masked views must hide or reduce exposure of:
- live coordinates
- location label detail
- reporter identifiers
- child identifiers
- ride identifiers
- school identifiers
- assigned operator identifiers
- any other sensitive data surfaced in dispatcher cards

## Unmask Policy
Unmasking should require:
- a dispatcher/admin role that is allowed to view safety data
- a verified permission flag or step-up condition
- explicit action intent
- audit logging

Unmasking should not mean permanent exposure. Re-masking must remain possible.

## Audit Policy
Audit logs should record:
- actor id
- actor role
- incident id
- action performed
- note or rationale
- safety ops metadata

## Web Ops Console Behavior
The ops console should:
- render masked incidents by default
- show a clear privacy state
- provide a deliberate unmask action
- keep actions minimal and easy to understand
- avoid clutter and over-visualization
- use calm language

## Mobile Safety Behavior
Mobile surfaces should:
- send SOS reliably
- queue critical events offline
- retry when connection returns
- avoid losing a report because of weak network
- keep the user informed with simple feedback

## Low-Bandwidth Strategy
- buffer critical events locally
- use bounded retry logic
- use small requests
- avoid heavy dashboards on mobile
- reconnect first, then fall back to HTTP

## Implementation Notes
The current implementation already supports the core direction:
- `backend/routes/safety.js`
- `backend/database/schema.js`
- `mobile/services/offlineSyncService.js`
- `mobile/services/TrackingClient.js`
- `app/(ops)/safety/page.tsx`
- `lib/safety-ops/*`

This spec should stay aligned with the actual codebase and be updated as the safety workflow evolves.
