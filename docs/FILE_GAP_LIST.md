# PoleSafe File Gap List

This list records the remaining gaps that are **not fully proven** in the current runtime. It is not a claim that the code is broken; it marks what still needs live validation or deeper auditing.

## High Priority Gaps

### 1) Live browser verification of homepage coverage widget
- **Files:** `app/page.tsx`
- **Status:** Implemented in code, not browser-verified here
- **Why it matters:** The coverage widget is one of the main public trust surfaces
- **Next action:** Open the homepage in a live browser session and verify the widget renders, tabs work, and no console errors appear

### 2) Live admin login proof
- **Files:** `backend/routes/auth.js`, `backend/public/admin.html`, `backend/config.js`
- **Status:** Implemented in code, not live-tested here
- **Why it matters:** Admin access must be secure and operational
- **Next action:** Test `POST /api/auth/admin-login` with the configured admin email/password hash flow

### 3) Mobile emulator proof for blog/community controllers
- **Files:** `mobile/screens/BlogDetail.js`, `mobile/screens/CommunityBoard.js`, `mobile/screens/CommunityBlog.js`, `mobile/screens/NewPost.js`
- **Status:** Implemented in code, not emulator-verified here
- **Why it matters:** These are active user-facing flows
- **Next action:** Launch Expo and confirm navigation, post loading, comment submission, and reaction behavior

### 4) Route-by-route runtime proof for school and rides flows
- **Files:** `backend/routes/rides.js`, `backend/routes/schools.js`, `backend/routes/trips.js`
- **Status:** Implemented in code, not live-endpoint verified here
- **Why it matters:** These routes drive booking, dispatch, attendance, and school operations
- **Next action:** Exercise each major endpoint with real requests in a local environment

### 5) Migration-level synchronization proof
- **Files:** `backend/database/schema.js` and all route/model consumers
- **Status:** Code appears aligned, but no dedicated migration/runtime validation was executed here
- **Why it matters:** Schema drift is the main source of hidden runtime errors
- **Next action:** Run migration/seed validation or a startup integration script against the live DB

## Medium Priority Gaps

### 6) Parents/driver surfaces not re-audited in this pass
- **Files:** `mobile/screens/ParentDashboard.js`, `mobile/screens/DriverDashboard.js`, related tabs in `mobile/PoleSafeApp.js`
- **Status:** Present, but not deeply revalidated in this turn
- **Next action:** Confirm those screens still align with the updated safety and booking flows

### 7) `/api/payments` live handoff not re-tested here
- **Files:** `backend/routes/payments.js`, `backend/routes/paymentsWebhook.js`
- **Status:** Mounted and used by the booking funnel, but not exercised live in this turn
- **Next action:** Confirm payment initiation and webhook handling in a sandbox/local run

### 8) `/api/community` list/detail/comment flow browser proof
- **Files:** `backend/routes/community.js`, `mobile/screens/BlogDetail.js`
- **Status:** Implemented, but only build-verified in this turn
- **Next action:** Confirm list/detail/reply flow from both mobile and backend sides

## Low Priority / Cosmetic Gaps

### 9) Remaining public/private wording sweeps
- **Files:** `backend/config.js`, `backend/public/*`, web copy components
- **Status:** Mostly aligned, but always worth checking for stale branding
- **Next action:** Sweep for stale references when touching public surfaces again

### 10) Design parity on every minor role page
- **Files:** `app/*`, `mobile/screens/*`
- **Status:** Main flagship surfaces are polished; some secondary screens may still be less premium
- **Next action:** Apply the same visual language selectively if needed

## Summary
- The repo is **not blocked**.
- The repo is **build-clean**.
- The remaining work is primarily **runtime proof**, not obvious missing code.
