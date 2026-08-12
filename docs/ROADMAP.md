# PoleSafe Roadmap

## Product Goal
Build PoleSafe into a trusted, Uganda-first school transport safety platform that feels simple for parents, schools, drivers, and operators.

## Guiding Principles
- safety first
- calm and simple workflows
- privacy by default
- low-bandwidth friendly
- cheap-phone compatible
- practical over flashy
- ship in small, usable chunks

## Current Focus Areas
### 1. Safety Operations
- SOS incident creation
- incident triage and response
- privacy masking and controlled unmasking
- audit trails for all sensitive actions
- dispatcher/operator role support

### 2. Ride Reliability
- recurring school ride schedules
- auto-dispatch support
- auto-billing support
- pickup words and teacher handover
- route and trip status consistency

### 3. Offline and Low-Bandwidth Resilience
- AsyncStorage-backed offline queue
- retries for SOS and location pings
- Socket.io reconnect and fallback handling
- bounded queue growth
- minimal retry overhead

### 4. Web Ops Console
- dispatcher triage view
- masked incident list by default
- explicit unmask flow for verified operators
- simple operator actions only
- avoid overbuilding analytics and maps too early

## Near-Term Roadmap
### Phase 14
- recurring ride schedules
- parent-facing schedule management
- schedule routing and navigation cleanup
- QA the recurring schedule flow end to end

### Phase 15
- safety ops foundation
- SOS incident records
- dispatcher triage console
- audit logging
- privacy masking and unmasking
- offline queue for SOS and location updates

### Phase 15 Refinement
- cleaner web ops contract
- better incident detail views
- controlled reveal workflow
- more complete role checks
- optional SQLite durability if AsyncStorage proves too small

## Future Ideas
These are not immediate priorities:
- richer admin analytics
- maps-heavy control rooms
- deep reporting dashboards
- complex automation engines
- multi-tenant governance suites

## What Success Looks Like
- parents can trust the app quickly
- schools can operate without confusion
- drivers can follow the workflow easily
- operators can respond to incidents without exposing sensitive data
- the app works reasonably well even on weak connections

## Delivery Approach
- keep scope tight
- validate each slice before adding the next
- prefer real workflows over feature sprawl
- avoid introducing admin complexity before the core safety loop is stable
