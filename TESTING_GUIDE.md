# 🧪 Attendance System Testing Guide

## Test Environment Setup

### Prerequisites
1. MongoDB running locally or cloud instance
2. Backend server running (`npm start` in `/backend`)
3. Mobile app running (Expo/React Native)
4. Test accounts:
   - School admin with valid school ID
   - Parent account with phone number
   - Driver account (for ride creation)

---

## Backend API Tests

### 1. Schema Validation

**Test: Child status field**
```bash
curl -X POST http://localhost:3000/api/parents/kids \
  -H "Authorization: Bearer <parent_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Child",
    "class": "P.5",
    "schoolId": "66b123...",
    "age": 10
  }'

# Expected response:
{
  "child": {
    "status": "pending",
    "registeredBy": "parent",
    ...
  },
  "message": "Test Child has been submitted to...",
  "pendingApproval": true
}
```

**Test: Attendance unique index**
```bash
# First attendance record - should succeed
curl -X POST http://localhost:3000/api/schools/66b123.../manual-attendance \
  -H "Authorization: Bearer <school_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "childId": "66b456...",
    "status": "present"
  }'

# Duplicate for same child, same day - should update, not duplicate
curl -X POST http://localhost:3000/api/schools/66b123.../manual-attendance \
  -H "Authorization: Bearer <school_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "childId": "66b456...",
    "status": "late"
  }'

# Verify: Only ONE record exists in database
```

---

### 2. Pending Children Workflow

**Test: List pending children**
```bash
curl http://localhost:3000/api/schools/66b123.../pending-children \
  -H "Authorization: Bearer <school_token>"

# Expected: Array of children with status: "pending"
```

**Test: Approve child**
```bash
curl -X POST http://localhost:3000/api/schools/66b123.../approve-child/66b789... \
  -H "Authorization: Bearer <school_token>" \
  -H "Content-Type: application/json" \
  -d '{"action": "approve"}'

# Expected:
{
  "message": "✅ [Child Name] approved!",
  "child": { "status": "active", ... }
}
```

**Test: Reject child**
```bash
curl -X POST http://localhost:3000/api/schools/66b123.../approve-child/66b789... \
  -H "Authorization: Bearer <school_token>" \
  -H "Content-Type: application/json" \
  -d '{"action": "reject"}'

# Expected:
{
  "message": "[Child Name] rejected...",
}
```

**Test: Invalid action**
```bash
curl -X POST http://localhost:3000/api/schools/66b123.../approve-child/66b789... \
  -H "Authorization: Bearer <school_token>" \
  -H "Content-Type: application/json" \
  -d '{"action": "delete"}'

# Expected: 400 Bad Request
# Error: "Action must be 'approve' or 'reject'"
```

---

### 3. School Add Child (Non-PoleSafe)

**Test: Add child with existing parent**
```bash
curl -X POST http://localhost:3000/api/schools/66b123.../add-child \
  -H "Authorization: Bearer <school_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Manual Child",
    "class": "P.3",
    "age": 8,
    "parentPhone": "+256700123456"
  }'

# Expected:
{
  "message": "✅ Manual Child added to school roster.",
  "child": {
    "status": "active",
    "registeredBy": "school",
    "parentLinked": true
  }
}
```

**Test: Add child with new parent**
```bash
curl -X POST http://localhost:3000/api/schools/66b123.../add-child \
  -H "Authorization: Bearer <school_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Orphan Child",
    "class": "P.2",
    "age": 7,
    "parentPhone": "+256709999999",
    "parentName": "New Parent"
  }'

# Expected: New minimal parent user created
# Check Users collection: hasSmartphone: false, isVerified: false
```

---

### 4. Manual Attendance

**Test: Mark present**
```bash
curl -X POST http://localhost:3000/api/schools/66b123.../manual-attendance \
  -H "Authorization: Bearer <school_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "childId": "66b456...",
    "status": "present",
    "notes": "Arrived on time"
  }'

# Expected:
{
  "message": "✅ Attendance marked: present",
  "attendance": { ... }
}
```

**Test: Invalid status**
```bash
curl -X POST http://localhost:3000/api/schools/66b123.../manual-attendance \
  -H "Authorization: Bearer <school_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "childId": "66b456...",
    "status": "sleeping"
  }'

# Expected: 400 Bad Request
# Error: "Invalid attendance status"
```

---

### 5. Attendance Report

**Test: Full report with mixed data**

**Setup:**
1. Create 3 children:
   - Child A: Has PoleSafe ride (gate_confirmed)
   - Child B: Manual attendance (marked present)
   - Child C: No data yet
2. Run report:

```bash
curl "http://localhost:3000/api/schools/66b123.../attendance-report?date=2026-08-09" \
  -H "Authorization: Bearer <school_token>"

# Expected stats:
{
  "stats": {
    "total": 3,
    "present": 2,
    "noData": 1,
    "poleSafeTracked": 1,
    "manuallyTracked": 1
  },
  "attendance": [
    {
      "childName": "Child A",
      "attendance": "present",
      "source": "auto_ride"
    },
    {
      "childName": "Child B",
      "attendance": "present",
      "source": "manual_school"
    },
    {
      "childName": "Child C",
      "attendance": "no_data",
      "source": null
    }
  ]
}
```

**Test: Manual overrides auto**

**Setup:**
1. Child has ride with status "en_route" (would show as "late")
2. Teacher manually marks as "present"

```bash
# Result should show:
{
  "attendance": "present",
  "source": "manual_school"
}
```

---

## Mobile App Tests

### 1. Pending Children Screen

**Test Case 1: Empty State**
- Prerequisites: No pending children
- Steps:
  1. Login as school admin
  2. Navigate to Pending Children
- Expected: Green checkmark with "No pending children" message

**Test Case 2: Approval Flow**
- Prerequisites: 1+ pending children
- Steps:
  1. Navigate to Pending Children
  2. See pending count badge
  3. Tap ✅ Approve on first child
  4. Confirm alert appears
- Expected:
  - Child removed from list
  - Success alert: "✅ Approved"
  - Pending count decreases

**Test Case 3: Rejection Flow**
- Steps:
  1. Navigate to Pending Children
  2. Tap ❌ Reject on a child
- Expected:
  - Child removed from list
  - Alert: "❌ Rejected"
  - Child status in DB: "rejected"

**Test Case 4: Pull to Refresh**
- Steps:
  1. On Pending Children screen
  2. Pull down to refresh
- Expected: Loading spinner, fresh data loaded

---

### 2. Attendance Report Screen

**Test Case 1: Stats Display**
- Prerequisites: Mixed attendance data
- Steps:
  1. Navigate to Attendance Report
- Expected:
  - 4 stat boxes: Present (green), Absent (red), Late (orange), Sick (purple)
  - Numbers match backend data
  - Tracking info shows auto/manual/no_data counts

**Test Case 2: Kid List Display**
- Steps:
  1. Scroll through kid list
- Expected:
  - Each kid has:
    - Avatar with first initial
    - Name + class
    - Status badge (✅ ❌ ⏰ 🤒 ❓)
    - Parent info with "(PoleSafe)" or "(No app)"
    - Arrival time if available
    - Source indicator

**Test Case 3: Pending Kid Indicator**
- Prerequisites: Pending child exists
- Steps:
  1. View kid with status: "pending"
- Expected: Yellow badge "⏳ Awaiting school approval"

**Test Case 4: Pull to Refresh**
- Steps:
  1. Pull down to refresh
- Expected: Fresh attendance data loaded

---

### 3. School Dashboard Integration

**Test Case 1: Pending Badge Visibility**
- Prerequisites: 3 pending children
- Steps:
  1. Login as school admin
  2. View dashboard
- Expected:
  - "Pending Children" button shows red badge with "3"

**Test Case 2: Badge Updates**
- Steps:
  1. Dashboard shows badge "2"
  2. Navigate to Pending Children
  3. Approve 1 child
  4. Go back to dashboard
  5. Pull to refresh
- Expected: Badge now shows "1"

**Test Case 3: No Badge When Zero**
- Prerequisites: No pending children
- Expected: No badge shown (clean UI)

**Test Case 4: Navigation**
- Steps:
  1. Tap "Pending Children" button
  2. Verify screen loads
  3. Go back
  4. Tap "Attendance Report" button
  5. Verify screen loads
- Expected: Smooth navigation both ways

---

## Edge Cases & Error Handling

### 1. Duplicate Approval Attempt
**Setup:** Child already approved  
**Action:** Try to approve again  
**Expected:** 404 "Pending child not found"

### 2. Approve Child from Wrong School
**Setup:** School A admin tries to approve child from School B  
**Expected:** 404 or 403 Forbidden (middleware blocks)

### 3. Network Timeout
**Setup:** Disconnect network  
**Action:** Refresh pending children  
**Expected:** Error caught in try/catch, console.log shows error

### 4. Invalid Date Format
**Action:** `GET /attendance-report?date=invalid`  
**Expected:** Falls back to today's date

### 5. Child Without Parent
**Setup:** Child created with `parentId: null`  
**Expected:** Report shows `parentName: "N/A"`, `parentPhone: "N/A"`

### 6. Same Day Status Change
**Setup:** Child marked "present" at 8am, then "late" at 9am  
**Expected:** One attendance record, status: "late", updatedAt reflects latest

---

## Performance Tests

### 1. Large School (500+ kids)
```bash
# Create 500 children
for i in {1..500}; do
  curl -X POST http://localhost:3000/api/schools/.../add-child \
    -d "{\"name\":\"Kid$i\",\"class\":\"P.1\"}" ...
done

# Load attendance report
time curl http://localhost:3000/api/schools/.../attendance-report

# Expected: Response < 2 seconds
```

### 2. Attendance History (1 year)
```bash
# Create attendance records for past 365 days
# Query with date range
curl "http://localhost:3000/api/schools/.../attendance-report?startDate=2025-08-09&endDate=2026-08-09"

# Expected: Response < 5 seconds (with indexes)
```

---

## Database Verification

### Check Indexes
```js
db.attendances.getIndexes()

// Expected:
[
  { key: { childId: 1, date: 1 }, unique: true },
  { key: { schoolId: 1, date: 1 } }
]
```

### Check Child Status Distribution
```js
db.children.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
])

// Expected:
{ _id: "active", count: 45 }
{ _id: "pending", count: 3 }
{ _id: "rejected", count: 1 }
```

### Check Attendance Source Breakdown
```js
db.attendances.aggregate([
  { $group: { _id: "$source", count: { $sum: 1 } } }
])

// Expected:
{ _id: "auto_ride", count: 30 }
{ _id: "manual_school", count: 15 }
```

---

## Regression Tests

After any changes, re-run:

1. ✅ Parent registration creates pending child
2. ✅ School approval changes status to active
3. ✅ School rejection changes status to rejected
4. ✅ Manual attendance creates/updates record
5. ✅ Attendance report combines all sources
6. ✅ Manual overrides auto-tracking
7. ✅ Unique index prevents duplicates
8. ✅ Pending count updates on dashboard
9. ✅ Pull-to-refresh works on all screens
10. ✅ Navigation flows work both directions

---

## Success Criteria

- [ ] All API endpoints return expected responses
- [ ] Mobile screens render without errors
- [ ] Pending workflow completes end-to-end
- [ ] Attendance report shows mixed data correctly
- [ ] Manual overrides auto-tracking
- [ ] No duplicate attendance records
- [ ] Dashboard badge updates in real-time
- [ ] Performance acceptable for 500+ kids
- [ ] No console errors in mobile app
- [ ] No 500 errors in backend logs

---

**Next Steps:**
1. Run all backend API tests via Postman/curl
2. Test mobile flows manually
3. Automated testing with Jest/Detox (future)
4. User acceptance testing with real school
5. Staging deployment + smoke tests
