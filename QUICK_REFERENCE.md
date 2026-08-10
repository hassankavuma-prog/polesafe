# 🚀 Attendance System Quick Reference

## 📋 TL;DR

**What was built:** Full attendance tracking for ALL kids (PoleSafe + non-PoleSafe) + parent registration approval workflow.

**Files changed:** 6 files  
**New endpoints:** 5  
**New screens:** 2  
**New DB models:** 1  

---

## 🔑 Key Concepts

### Child Status States
```
pending  → Parent registered, awaiting school approval
active   → Approved, appears in attendance
rejected → School rejected registration
```

### Child Registration Sources
```
parent → Parent added via app (starts as pending)
school → School admin added (starts as active)
```

### Attendance Sources (Priority Order)
```
1. manual_school   → Teacher override (highest priority)
2. auto_ride       → PoleSafe ride tracking
3. (no data)       → Not yet recorded
```

---

## 🛠️ Quick Commands

### Backend Server
```bash
cd /data/.openclaw/workspace/polesafe-code/backend
npm start
```

### Mobile App
```bash
cd /data/.openclaw/workspace/polesafe-code/mobile
expo start
```

### Test API Endpoint
```bash
# Get pending children
curl http://localhost:3000/api/schools/SCHOOL_ID/pending-children \
  -H "Authorization: Bearer YOUR_TOKEN"

# Approve a child
curl -X POST http://localhost:3000/api/schools/SCHOOL_ID/approve-child/CHILD_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "approve"}'

# Get attendance report
curl http://localhost:3000/api/schools/SCHOOL_ID/attendance-report?date=2026-08-09 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📁 File Locations

### Backend
```
backend/
├── database/
│   └── schema.js              ← Child status + Attendance model
└── routes/
    ├── schools.js             ← 5 new endpoints
    └── parents.js             ← Pending child creation
```

### Mobile
```
mobile/
└── screens/
    ├── SchoolDashboard.js     ← Pending badge + buttons
    ├── PendingChildren.js     ← NEW: Approval screen
    └── AttendanceReport.js    ← NEW: Full attendance
```

---

## 🌐 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/schools/:id/pending-children` | List pending kids |
| POST | `/api/schools/:id/approve-child/:childId` | Approve/reject |
| POST | `/api/schools/:id/add-child` | School adds kid manually |
| POST | `/api/schools/:id/manual-attendance` | Mark attendance |
| GET | `/api/schools/:id/attendance-report` | Full report |
| POST | `/api/parents/kids` | Parent registers kid (now pending) |

---

## 🎯 Common Tasks

### Add a Pending Child (Parent)
```js
POST /api/parents/kids
{
  "name": "John Doe",
  "class": "P.5",
  "schoolId": "66b123...",
  "age": 10
}

// Response:
{
  "child": { "status": "pending", ... },
  "pendingApproval": true
}
```

### Approve a Child (School)
```js
POST /api/schools/:id/approve-child/:childId
{ "action": "approve" }

// Child status: pending → active
```

### Mark Manual Attendance
```js
POST /api/schools/:id/manual-attendance
{
  "childId": "66b456...",
  "status": "present",
  "notes": "Arrived on time"
}
```

### Get Today's Attendance
```js
GET /api/schools/:id/attendance-report?date=2026-08-09

// Returns:
{
  "stats": { total, present, absent, late, sick, noData },
  "attendance": [ ... ]
}
```

---

## 🧩 Data Models

### Child (Updated)
```js
{
  _id, parentId, name, class, schoolId, age,
  status: 'pending|active|rejected',
  registeredBy: 'parent|school',
  approvedBy: ObjectId,
  approvedAt: Date,
  isActive: Boolean
}
```

### Attendance (New)
```js
{
  _id, schoolId, childId, date,
  status: 'present|absent|late|sick|excused|no_ride',
  source: 'auto_ride|manual_school|sms_parent|sms_school',
  recordedBy: ObjectId,
  notes: String,
  arrivalTime: Date,
  departureTime: Date
}

// Unique index: (childId + date)
```

---

## 🎨 UI Components

### PendingChildren.js
```jsx
// Key features:
- Pull to refresh
- ✅ Approve / ❌ Reject buttons
- Empty state when no pending
- Parent info display
- Count badge

// Navigation:
navigation.navigate('PendingChildren')
```

### AttendanceReport.js
```jsx
// Key features:
- Stats cards (present, absent, late, sick)
- Tracking breakdown (auto/manual/no_data)
- Full kid list with status badges
- Color-coded status indicators
- Pull to refresh

// Navigation:
navigation.navigate('AttendanceReport')
```

### SchoolDashboard.js (Updated)
```jsx
// New features:
- Pending count badge (red circle)
- Pending Children button
- Attendance Report button

// State:
const [pendingCount, setPendingCount] = useState(0);
```

---

## 🔐 Middleware & Auth

### requireSchoolAccess
```js
// Ensures:
1. User is authenticated
2. User is school_admin or polesafe_admin
3. User belongs to requested school

// Applied to:
- All school/* endpoints
```

### requireRole('parent')
```js
// Ensures user is a parent
// Applied to:
- Parent kid registration
```

---

## 🐛 Debugging Tips

### Check Child Status
```js
db.children.find({ schoolId: ObjectId("...") })

// Look for: status, registeredBy fields
```

### Check Attendance Records
```js
db.attendances.find({ 
  schoolId: ObjectId("..."), 
  date: ISODate("2026-08-09T00:00:00Z") 
})

// Verify: No duplicates for same child
```

### Check Pending Count
```js
db.children.countDocuments({
  schoolId: ObjectId("..."),
  status: "pending",
  isActive: true
})
```

### Backend Logs
```bash
# Look for:
"📢 NOTIFY SCHOOL: New child registered..."

# Indicates parent registration succeeded
```

### Mobile Console
```js
// In PendingChildren.js:
console.log('Pending children loaded:', data);

// In AttendanceReport.js:
console.log('Attendance report:', report);
```

---

## ⚠️ Common Pitfalls

1. **Forgot to add screens to navigator**  
   → Screens created but not registered → navigation fails

2. **Child stays pending after approval**  
   → Check endpoint returns 200  
   → Verify `child.status = 'active'` in DB

3. **Duplicate attendance records**  
   → Check unique index exists: `{ childId: 1, date: 1 }`

4. **Manual doesn't override auto**  
   → Check order in attendance-report logic (manual should be after auto)

5. **Pending count not updating**  
   → Need to re-fetch on focus or use global state

6. **Date format issues**  
   → Always use ISO format: `2026-08-09T00:00:00Z`

---

## 📊 Monitoring

### Key Metrics
- Pending children count per school
- Approval rate (approved / total pending)
- Manual vs auto attendance ratio
- Average time to approve (approvedAt - createdAt)

### Queries
```js
// Pending children by school
db.children.aggregate([
  { $match: { status: "pending" } },
  { $group: { _id: "$schoolId", count: { $sum: 1 } } }
])

// Attendance coverage per day
db.attendances.aggregate([
  { $match: { date: ISODate("2026-08-09") } },
  { $group: { _id: "$source", count: { $sum: 1 } } }
])
```

---

## 🚀 Next Steps

1. **Navigation:** Add screens to Stack Navigator
2. **Testing:** Run full test suite (see TESTING_GUIDE.md)
3. **Polish:** Add loading states, error messages
4. **Notifications:** SMS/WhatsApp when child approved
5. **Analytics:** Track approval times, attendance trends
6. **Export:** CSV/PDF attendance reports

---

## 📖 Full Documentation

- **ATTENDANCE_SYSTEM_SUMMARY.md** — Complete feature overview
- **NAVIGATION_INTEGRATION.md** — How to add screens to nav
- **TESTING_GUIDE.md** — Full test suite

---

**Questions?** Check inline code comments or read ATTENDANCE_SYSTEM_SUMMARY.md for detailed explanations.
