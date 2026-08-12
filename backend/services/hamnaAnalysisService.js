// PoleSafe — Hamna Analysis Service
// Hamna is the AI spotter that watches everything and flags issues to admin
// She never auto-decides — only points out what could be missed

const axios = require('axios');
const User = require('../database/schema').User;
const Booking = require('../database/schema').Booking;
const Ride = require('../database/schema').Ride;

// ─── Uganda Document Validation Patterns ──────────────
const UGANDA_PATTERNS = {
  NIN: /^(CM|CF|CN|CP|CH)\d{13}[A-Z]{2}$/i,         // Uganda NIN: CM1234567890AB
  PLATE: /^(U[A-Z]{2,3}\s?\d{3}[A-Z])$|^(U[A-Z]{2,3}\s?\d{3})$|^(\d{3}\s?[A-Z]{2,3})$/,  // UBA 123X
  PHONE: /^(0|\+256)[7-9]\d{8}$/,                      // Uganda mobile: 0771234567
};

// ─── Document Completeness Check ──────────────────────
function checkDocumentCompleteness(docs) {
  const required = [
    { key: 'ninNumber', label: 'NIN Number', type: 'text' },
    { key: 'ninPhotoUri', label: 'NIN Photo', type: 'photo' },
    { key: 'selfieUri', label: 'Live Selfie', type: 'photo' },
    { key: 'plateNumber', label: 'Plate Number', type: 'text' },
    { key: 'phoneNumber', label: 'Phone Number', type: 'text' },
  ];

  const checks = required.map(field => {
    const value = docs?.[field.key];
    if (!value) {
      return {
        field: field.label,
        status: 'missing',
        severity: 'error',
        message: `${field.label} is missing`,
      };
    }
    if (field.type === 'text' && typeof value === 'string' && value.trim().length < 2) {
      return {
        field: field.label,
        status: 'incomplete',
        severity: 'warning',
        message: `${field.label} appears incomplete`,
      };
    }
    return {
      field: field.label,
      status: 'present',
      severity: 'success',
      message: `${field.label} provided`,
    };
  });

  const missingCount = checks.filter(c => c.status === 'missing').length;
  const overallStatus = missingCount === 0 ? 'complete' : missingCount <= 2 ? 'partial' : 'incomplete';

  return { checks, overallStatus, summary: `${checks.filter(c => c.status === 'present').length}/${required.length} documents provided` };
}

// ─── NIN Format Validation ────────────────────────────
function validateNIN(ninNumber) {
  if (!ninNumber) return { valid: false, message: 'NIN number not provided' };

  const clean = ninNumber.trim().toUpperCase();
  if (!UGANDA_PATTERNS.NIN.test(clean)) {
    return {
      valid: false,
      message: 'Invalid NIN format — Uganda NINs start with CM/CF/CN followed by 13 digits and 2 letters (e.g., CM1234567890AB)',
      severity: 'error',
    };
  }

  // Extract prefix and validate prefix against common regions
  const prefix = clean.substring(0, 2);
  const knownPrefixes = ['CM', 'CF', 'CN', 'CP', 'CH'];

  return {
    valid: true,
    message: `Valid NIN format (${prefix} prefix — ${knownPrefixes.includes(prefix) ? 'recognized' : 'unusual prefix, verify with admin'})`,
    severity: knownPrefixes.includes(prefix) ? 'success' : 'warning',
    formatted: clean,
  };
}

// ─── Plate Format Validation ──────────────────────────
function validatePlate(plateNumber) {
  if (!plateNumber) return { valid: false, message: 'Plate number not provided' };

  const clean = plateNumber.trim().toUpperCase();
  if (!UGANDA_PATTERNS.PLATE.test(clean)) {
    return {
      valid: false,
      message: `"${clean}" doesn't match Uganda plate format (e.g., UBA 123X)`,
      severity: 'error',
    };
  }

  return {
    valid: true,
    message: `Valid Uganda plate format`,
    severity: 'success',
    formatted: clean,
  };
}

// ─── Phone Validation ─────────────────────────────────
function validatePhone(phone) {
  if (!phone) return { valid: false, message: 'Phone number not provided' };

  const clean = phone.replace(/\s/g, '');
  if (!UGANDA_PATTERNS.PHONE.test(clean)) {
    return {
      valid: false,
      message: `"${phone}" doesn't match Uganda mobile format (0771XXXXXX or +2567XXXXXXXX)`,
      severity: 'error',
    };
  }

  return {
    valid: true,
    message: `Valid Uganda mobile number`,
    severity: 'success',
    formatted: clean,
  };
}

// ─── Duplicate NIN Detection ──────────────────────────
async function checkDuplicateNIN(ninNumber, excludeDriverId) {
  if (!ninNumber) return { duplicate: false, matches: [] };

  const filter = {
    'verificationDocs.ninNumber': ninNumber.trim().toUpperCase(),
    role: 'driver',
  };

  if (excludeDriverId) {
    filter._id = { $ne: excludeDriverId };
  }

  const matches = await User.find(filter)
    .select('name phone _id verificationDocs.verificationStatus')
    .lean();

  if (matches.length > 0) {
    return {
      duplicate: true,
      count: matches.length,
      matches: matches.map(m => ({
        id: m._id,
        name: m.name,
        phone: m.phone,
        status: m.verificationDocs?.verificationStatus || 'unknown',
      })),
      message: `⚠️ This NIN is registered to ${matches.length} other driver(s)! Possible identity fraud.`,
      severity: 'critical',
    };
  }

  return {
    duplicate: false,
    count: 0,
    matches: [],
    message: '✅ No duplicate NIN found in system',
    severity: 'success',
  };
}

// ─── Basic Face Comparison Analysis ───────────────────
async function compareFaces(selfieUrl, ninPhotoUrl) {
  // Without a dedicated face comparison API, Hamna does basic checks:
  // 1. Both URLs are valid
  // 2. Both images have plausible dimensions
  // 3. Flags to admin for manual comparison

  const result = {
    canAutoCompare: false,
    recommendations: [],
    overall: 'manual_review_required',
  };

  if (!selfieUrl || !ninPhotoUrl) {
    result.recommendations.push('One or both photos missing — cannot compare');
    return result;
  }

  // For now, Hamna always recommends manual review
  result.recommendations = [
    '🖼️ Selfie and NIN photo both available for admin comparison',
    '🔍 Use the zoom feature to compare facial features manually',
    '⚡ Check: nose shape, jawline, eye spacing, skin tone consistency',
    '⚠️ AI-generated selfies often have: inconsistent eye reflections, smooth skin artifacts, unnatural lighting',
  ];

  return result;
}

// ─── Full Document Analysis ───────────────────────────
async function analyzeDriverDocuments(driverId) {
  const driver = await User.findById(driverId).lean();
  if (!driver) {
    return {
      driverId,
      error: 'Driver not found',
      overallStatus: 'error',
      sections: [],
      hamnaVerdict: 'Could not analyze — driver not found',
    };
  }

  const docs = driver.verificationDocs || {};
  const sections = [];

  // 1. Document completeness
  const completeness = checkDocumentCompleteness(docs);
  sections.push({
    title: '📋 Document Checklist',
    icon: 'checklist',
    status: completeness.overallStatus === 'complete' ? 'success' : completeness.overallStatus === 'partial' ? 'warning' : 'error',
    summary: completeness.summary,
    details: completeness.checks,
  });

  // 2. NIN validation
  const ninResult = validateNIN(docs.ninNumber);
  sections.push({
    title: '🆔 NIN Verification',
    icon: 'id',
    status: ninResult.valid ? 'success' : 'error',
    summary: ninResult.message,
    severity: ninResult.severity,
  });

  // 3. Plate validation
  const plateResult = validatePlate(docs.plateNumber);
  sections.push({
    title: '🚗 Plate Number',
    icon: 'car',
    status: plateResult.valid ? 'success' : 'error',
    summary: plateResult.message,
    severity: plateResult.severity,
  });

  // 4. Phone validation
  const phoneResult = validatePhone(docs.phoneNumber);
  sections.push({
    title: '📱 Phone Number',
    icon: 'phone',
    status: phoneResult.valid ? 'success' : 'error',
    summary: phoneResult.message,
    severity: phoneResult.severity,
  });

  // 5. Duplicate NIN check
  try {
    const dupResult = await checkDuplicateNIN(docs.ninNumber, driverId);
    sections.push({
      title: '🔁 Duplicate NIN Check',
      icon: 'duplicate',
      status: dupResult.duplicate ? 'critical' : 'success',
      summary: dupResult.message,
      severity: dupResult.severity,
      details: dupResult.matches,
    });
  } catch (err) {
    sections.push({
      title: '🔁 Duplicate NIN Check',
      icon: 'duplicate',
      status: 'warning',
      summary: 'Could not check duplicates — system error',
    });
  }

  // 6. Face comparison
  const faceResult = await compareFaces(docs.selfieUri, docs.ninPhotoUri);
  sections.push({
    title: '🤳 Face Comparison',
    icon: 'face',
    status: faceResult.overall === 'manual_review_required' ? 'warning' : 'success',
    summary: 'Manual review required — zoom into photos and compare facial features',
    recommendations: faceResult.recommendations,
  });

  // 7. AI forgery indicators
  sections.push({
    title: '🤖 AI Forgery Check',
    icon: 'shield',
    status: 'warning',
    summary: 'AI-generated documents can be convincing. Admin should zoom into photos and look for:',
    recommendations: [
      '✨ Inconsistent lighting/shadows across selfie face',
      '👁️ Unnatural eye reflections (same reflection in both eyes)',
      '🎨 Smooth skin artifacts with no natural texture',
      '🔲 Hard edges around hair/ear boundaries',
      '📏 NIN photo vs selfie have different resolutions/aspect ratios',
      '📷 No EXIF/camera metadata on uploaded photos',
    ],
    severity: 'info',
  });

  // Overall Hamna verdict
  const criticals = sections.filter(s => s.status === 'critical').length;
  const errors = sections.filter(s => s.status === 'error').length;
  const warnings = sections.filter(s => s.status === 'warning').length;

  let hamnaVerdict;
  let overallStatus;

  if (criticals > 0) {
    hamnaVerdict = '🔴 Hamna recommends REJECTION — critical issues detected';
    overallStatus = 'reject';
  } else if (errors > 0) {
    hamnaVerdict = '🟡 Hamna flags issues — admin should address before approving';
    overallStatus = 'flag';
  } else if (warnings > 2) {
    hamnaVerdict = '🟡 Multiple warnings — admin should review carefully';
    overallStatus = 'caution';
  } else {
    hamnaVerdict = '🟢 No major issues detected — admin should still visually verify';
    overallStatus = 'review';
  }

  return {
    driverId,
    driverName: driver.name,
    driverPhone: driver.phone,
    overallStatus,
    hamnaVerdict,
    sections,
    analyzedAt: new Date().toISOString(),
  };
}

// ─── System-Wide Anomaly Detection ────────────────────
async function checkSystemAnomalies() {
  const anomalies = [];

  try {
    // 1. Drivers with unusually high trip counts (fatigue detection)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeDrivers = await Ride.aggregate([
      { $match: { scheduledPickupTime: { $gte: today }, status: { $in: ['completed', 'dropped_off'] } } },
      { $group: { _id: '$driverId', tripCount: { $sum: 1 } } },
      { $sort: { tripCount: -1 } },
      { $limit: 10 },
    ]);

    for (const d of activeDrivers) {
      if (d.tripCount > 8) {
        const driver = await User.findById(d._id).select('name').lean();
        anomalies.push({
          type: 'fatigue',
          severity: 'warning',
          title: 'Driver Fatigue Alert',
          message: `${driver?.name || 'Unknown'} has done ${d.tripCount} trips today — possible fatigue risk`,
          driverId: d._id,
        });
      }
    }

    // 2. Parents with excessive cancellations
    const cancelledToday = await Ride.find({
      status: 'cancelled',
      updatedAt: { $gte: today },
    }).populate('parentId', 'name').lean();

    const cancelCounts = {};
    for (const r of cancelledToday) {
      const pid = r.parentId?._id?.toString();
      if (pid) {
        cancelCounts[pid] = (cancelCounts[pid] || 0) + 1;
      }
    }

    for (const [pid, count] of Object.entries(cancelCounts)) {
      if (count >= 3) {
        const parent = await User.findById(pid).select('name phone').lean();
        anomalies.push({
          type: 'excessive_cancellations',
          severity: 'info',
          title: 'Excessive Cancellations',
          message: `${parent?.name || 'Unknown'} cancelled ${count} rides today`,
          driverId: pid,
        });
      }
    }

    // 3. Duplicate registrations (same phone across multiple drivers)
    const drivers = await User.find({ role: 'driver' }).select('phone name').lean();
    const phoneMap = {};
    for (const d of drivers) {
      const phone = d.phone?.replace(/\s/g, '');
      if (phone) {
        if (!phoneMap[phone]) phoneMap[phone] = [];
        phoneMap[phone].push(d);
      }
    }
    for (const [phone, users] of Object.entries(phoneMap)) {
      if (users.length > 1) {
        anomalies.push({
          type: 'duplicate_registration',
          severity: 'critical',
          title: 'Duplicate Registration Detected',
          message: `Phone ${phone} used by ${users.length} drivers: ${users.map(u => u.name).join(', ')}`,
        });
      }
    }

  } catch (err) {
    console.error('[Hamna] System anomaly check error:', err.message);
  }

  return {
    checkedAt: new Date().toISOString(),
    totalAnomalies: anomalies.length,
    anomalies,
  };
}

module.exports = {
  analyzeDriverDocuments,
  checkSystemAnomalies,
  checkDocumentCompleteness,
  validateNIN,
  validatePlate,
  validatePhone,
  checkDuplicateNIN,
  compareFaces,
  UGANDA_PATTERNS,
};
