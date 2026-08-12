const express = require('express');
const router = express.Router();
const { User, Child, Ride, SafetyIncident, AuditLog } = require('../database/schema');

const makeIncidentNumber = () => `INC-${Date.now().toString(36).toUpperCase()}`;

const hasAdminAccess = (role) => ['polesafe_admin', 'school_admin'].includes(role);
const hasDispatcherAccess = (role) => ['polesafe_admin', 'school_admin', 'dispatcher', 'ops_dispatcher'].includes(role);
const hasVerifiedUnmaskAccess = (req) => {
  const role = req.userRole || req.user?.role || req.body.userRole || req.query.userRole;
  if (!hasDispatcherAccess(role)) return false;
  if (req.user?.verifiedSafetyOps === true || req.user?.safetyOpsVerified === true) return true;
  return req.body?.verified === true || req.query?.verified === 'true';
};

const redactIncident = (incident, { unmask = false } = {}) => {
  if (!incident) return incident;
  const masked = incident.privacyMasked && !unmask;
  return {
    ...incident,
    privacyMasked: masked ? true : !!incident.privacyMasked,
    liveLocation: masked ? null : incident.liveLocation,
    locationLabel: masked ? 'Hidden until verified SOS' : incident.locationLabel,
    reporterUserId: masked ? null : incident.reporterUserId,
    childId: masked ? null : incident.childId,
    rideId: masked ? null : incident.rideId,
    schoolId: masked ? null : incident.schoolId,
    assignedOperatorId: masked ? null : incident.assignedOperatorId,
  };
};

const auditSafetyAccess = async ({ action, actorId, actorRole, incidentId, note, metadata = {} }) => {
  await logIncidentAudit({ action, actorId, actorRole, incidentId, note, metadata });
};


const logIncidentAudit = async ({ action, actorId, actorRole, incidentId, note, metadata = {} }) => {
  try {
    await AuditLog.create({
      action,
      userId: actorId,
      userRole: actorRole,
      resourceType: 'safety_incident',
      resourceId: String(incidentId),
      details: { note },
      metadata: { module: 'safety_ops', ...metadata },
    });
  } catch (err) {
    console.error('Audit log write failed:', err.message);
  }
};

// ============================================================
// SOS/Emergency Alert System
// ============================================================

router.post('/sos', async (req, res) => {
  try {
    const { userId, userRole, kidId, rideId, location, message, triggerType, severity, deviceStatus } = req.body;
    
    if (!userId || !userRole) {
      return res.status(400).json({ error: 'User ID and role required' });
    }

    const ride = rideId ? await Ride.findById(rideId).populate('childId schoolId') : null;
    const incident = await SafetyIncident.create({
      incidentNumber: makeIncidentNumber(),
      triggerType: triggerType || 'manual_sos',
      severity: severity || 'high',
      status: 'active',
      reporterUserId: userId,
      reporterRole: userRole,
      childId: kidId || ride?.childId?._id || null,
      rideId: rideId || null,
      schoolId: ride?.schoolId?._id || null,
      liveLocation: location?.coordinates ? { type: 'Point', coordinates: location.coordinates } : undefined,
      locationLabel: location?.label || location?.address || null,
      deviceStatus: deviceStatus || {},
      privacyMasked: true,
      auditTrail: [{ action: 'incident_created', actorId: userId, actorRole: userRole, note: message || 'Emergency!', timestamp: new Date() }],
      contactRelay: [],
    });

    const sosAlert = {
      userId,
      userRole,
      kidId: kidId || null,
      rideId: rideId || null,
      location: location || null,
      message: message || 'Emergency!',
      timestamp: new Date(),
      status: 'active',
      notified: [],
      contacts: [],
      incidentId: incident._id,
    };

    if (!global.sosAlerts) global.sosAlerts = [];
    global.sosAlerts.push(sosAlert);

    console.log(`🚨 SOS ALERT from ${userRole} ${userId}: ${message}`, location);

    // Find contacts based on role
    let contacts = [];

    if (userRole === 'parent' || userRole === 'rider') {
      if (kidId) {
        const kid = await Child.findById(kidId);
        if (kid) {
          const Ride = require('../database/schema').Ride;
          const rides = await Ride.find({ 
            kidId, 
            status: { $in: ['pending', 'confirmed', 'in_progress'] } 
          }).populate('driverId');
          rides.forEach(ride => {
            if (ride.driverId) {
              contacts.push({ userId: ride.driverId._id, role: 'driver' });
            }
          });
        }
      }
    }

    if (userRole === 'driver') {
      if (kidId) {
        const kid = await Child.findById(kidId).populate('parentId');
        if (kid && kid.parentId) {
          contacts.push({ userId: kid.parentId._id, role: 'parent' });
        }
      }
    }

    sosAlert.contacts = contacts;
    incident.contactRelay = contacts.map(c => ({ contactType: c.role, contactId: String(c.userId), status: 'sent', sentAt: new Date() }));
    await incident.save();
    await logIncidentAudit({ action: 'incident_triaged', actorId: userId, actorRole: userRole, incidentId: incident._id, note: `contacts=${contacts.length}` });

    res.json({
      success: true,
      alert: sosAlert,
      incident: redactIncident(incident.toObject()),
      contactsNotified: contacts.length,
    });
  } catch (err) {
    console.error('SOS error:', err);
    res.status(500).json({ error: 'Failed to process SOS alert' });
  }
});

router.get('/sos/active', async (req, res) => {
  try {
    const incidents = await SafetyIncident.find({ status: { $in: ['active', 'triaged', 'escalated'] } })
      .sort({ createdAt: -1 })
      .lean();
    res.json(incidents.map((incident) => redactIncident(incident)));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

router.post('/sos/acknowledge', async (req, res) => {
  try {
    const { incidentId, userId, userRole, note } = req.body;
    const incident = await SafetyIncident.findById(incidentId);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    incident.status = 'triaged';
    incident.assignedOperatorId = incident.assignedOperatorId || userId;
    incident.auditTrail.push({ action: 'incident_acknowledged', actorId: userId, actorRole: userRole, note, timestamp: new Date() });
    await incident.save();
    await logIncidentAudit({ action: 'incident_acknowledged', actorId: userId, actorRole: userRole, incidentId: incident._id, note });
    res.json({ success: true, incident: redactIncident(incident.toObject()) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

router.post('/sos/resolve', async (req, res) => {
  try {
    const { incidentId, userId, userRole, resolutionNote, falseAlarmReason } = req.body;
    const incident = await SafetyIncident.findById(incidentId);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    incident.status = falseAlarmReason ? 'false_alarm' : 'resolved';
    incident.resolvedById = userId;
    incident.resolutionNote = resolutionNote || '';
    incident.falseAlarmReason = falseAlarmReason || '';
    incident.auditTrail.push({ action: 'incident_resolved', actorId: userId, actorRole: userRole, note: resolutionNote || falseAlarmReason || '', timestamp: new Date() });
    await incident.save();
    await logIncidentAudit({ action: 'incident_resolved', actorId: userId, actorRole: userRole, incidentId: incident._id, note: resolutionNote || falseAlarmReason || '' });
    res.json({ success: true, incident: redactIncident(incident.toObject()) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

router.get('/incidents', async (req, res) => {
  try {
    const incidents = await SafetyIncident.find().sort({ createdAt: -1 }).limit(100).lean();
    res.json({ incidents: incidents.map((incident) => redactIncident(incident)) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

router.get('/dispatcher/dashboard', async (req, res) => {
  try {
    const role = req.userRole || req.user?.role || 'system';
    if (req.userRole && !hasAdminAccess(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const [active, triaged, resolved] = await Promise.all([
      SafetyIncident.countDocuments({ status: 'active' }),
      SafetyIncident.countDocuments({ status: { $in: ['triaged', 'escalated'] } }),
      SafetyIncident.countDocuments({ status: 'resolved' }),
    ]);

    const incidents = await SafetyIncident.find({ status: { $in: ['active', 'triaged', 'escalated'] } })
      .sort({ severity: -1, createdAt: -1 })
      .limit(20)
      .lean();

    res.json({
      stats: { active, triaged, resolved },
      incidents: incidents.map((incident) => redactIncident(incident)),
      privacyMode: 'masked',
      allowedActions: ['acknowledge', 'assign', 'escalate', 'resolve', 'mark_false_alarm'],
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load dispatcher dashboard' });
  }
});

router.patch('/incidents/:id/assign', async (req, res) => {
  try {
    const { assignedOperatorId, note, userId, userRole } = req.body;
    const incident = await SafetyIncident.findById(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    incident.assignedOperatorId = assignedOperatorId;
    incident.status = 'triaged';
    incident.auditTrail.push({ action: 'incident_assigned', actorId: userId, actorRole: userRole, note, timestamp: new Date() });
    await incident.save();
    await logIncidentAudit({ action: 'incident_assigned', actorId: userId, actorRole: userRole, incidentId: incident._id, note });
    res.json({ success: true, incident: redactIncident(incident.toObject()) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign incident' });
  }
});

router.patch('/incidents/:id/escalate', async (req, res) => {
  try {
    const { userId, userRole, note } = req.body;
    const incident = await SafetyIncident.findById(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    incident.status = 'escalated';
    incident.severity = 'critical';
    incident.auditTrail.push({ action: 'incident_escalated', actorId: userId, actorRole: userRole, note, timestamp: new Date() });
    await incident.save();
    await logIncidentAudit({ action: 'incident_escalated', actorId: userId, actorRole: userRole, incidentId: incident._id, note });
    res.json({ success: true, incident: redactIncident(incident.toObject()) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to escalate incident' });
  }
});

router.patch('/incidents/:id/mask', async (req, res) => {
  try {
    const { userId, userRole, note } = req.body;
    const incident = await SafetyIncident.findById(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    if (!hasDispatcherAccess(userRole || req.userRole || req.user?.role)) {
      return res.status(403).json({ error: 'Dispatcher access required to mask incident data' });
    }
    incident.privacyMasked = true;
    incident.auditTrail.push({ action: 'incident_masked', actorId: userId, actorRole: userRole, note, timestamp: new Date() });
    await incident.save();
    await logIncidentAudit({ action: 'incident_masked', actorId: userId, actorRole: userRole, incidentId: incident._id, note });
    res.json({ success: true, incident: redactIncident(incident.toObject()) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mask incident' });
  }
});



router.post('/incidents/:id/unmask', async (req, res) => {
  try {
    const { userId, userRole, note, verified } = req.body;
    const incident = await SafetyIncident.findById(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    if (!hasVerifiedUnmaskAccess(req)) {
      return res.status(403).json({ error: 'Verified dispatcher access required to unmask incident data' });
    }

    incident.privacyMasked = false;
    incident.auditTrail.push({ action: 'incident_unmasked', actorId: userId, actorRole: userRole, note, timestamp: new Date() });
    await incident.save();
    await auditSafetyAccess({ action: 'incident_unmasked', actorId: userId, actorRole: userRole, incidentId: incident._id, note, metadata: { verified: !!verified } });
    res.json({ success: true, incident: redactIncident(incident.toObject(), { unmask: true }) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unmask incident' });
  }
});

router.post('/incidents/:id/re-mask', async (req, res) => {
  try {
    const { userId, userRole, note } = req.body;
    const incident = await SafetyIncident.findById(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    if (!hasDispatcherAccess(userRole || req.userRole || req.user?.role)) {
      return res.status(403).json({ error: 'Dispatcher access required to re-mask incident data' });
    }

    incident.privacyMasked = true;
    incident.auditTrail.push({ action: 'incident_re_masked', actorId: userId, actorRole: userRole, note, timestamp: new Date() });
    await incident.save();
    await auditSafetyAccess({ action: 'incident_re_masked', actorId: userId, actorRole: userRole, incidentId: incident._id, note });
    res.json({ success: true, incident: redactIncident(incident.toObject()) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to re-mask incident' });
  }
});

router.get('/incidents/:id', async (req, res) => {
  try {
    const incident = await SafetyIncident.findById(req.params.id).lean();
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    const unmask = hasVerifiedUnmaskAccess(req) && (req.query.unmask === 'true' || req.query.unmask === '1' || req.query.unmask === true);
    await auditSafetyAccess({ action: unmask ? 'incident_view_unmasked' : 'incident_view_masked', actorId: req.userId || req.body.userId || req.query.userId || 'unknown', actorRole: req.userRole || req.body.userRole || req.query.userRole || 'unknown', incidentId: incident._id, note: unmask ? 'unmask requested' : 'masked view', metadata: { unmask } });
    res.json({ incident: redactIncident(incident, { unmask }) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch incident' });
  }
});


// ============================================================
// Driver Verification
// ============================================================

router.post('/driver/verify', async (req, res) => {
  try {
    const { driverId, approved, adminNotes } = req.body;
    const driver = await User.findById(driverId);
    if (!driver || driver.role !== 'driver') {
      return res.status(404).json({ error: 'Driver not found' });
    }
    driver.isDriverIdVerified = approved;
    await driver.save();
    res.json({
      success: true,
      driver: { id: driver._id, name: driver.name, phone: driver.phone, verified: driver.isDriverIdVerified },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify driver' });
  }
});

router.get('/driver/pending', async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver', isDriverIdVerified: false })
      .select('name phone createdAt')
      .sort({ createdAt: -1 });
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending drivers' });
  }
});

// ============================================================
// School Verification
// ============================================================

router.post('/school/verify', async (req, res) => {
  try {
    const { schoolId, approved, adminNotes } = req.body;
    const school = await User.findById(schoolId);
    if (!school || school.role !== 'school_admin') {
      return res.status(404).json({ error: 'School not found' });
    }
    school.verifiedBy = approved ? (req.body.adminId || 'system') : undefined;
    await school.save();
    res.json({
      success: true,
      school: { id: school._id, name: school.name, phone: school.phone, verified: !!school.verifiedBy },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify school' });
  }
});

router.get('/school/pending', async (req, res) => {
  try {
    const schools = await User.find({ role: 'school_admin', verifiedBy: null })
      .select('name phone createdAt')
      .sort({ createdAt: -1 });
    res.json(schools);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending schools' });
  }
});

module.exports = router;
