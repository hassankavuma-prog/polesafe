function canReleaseDriverForGrade(grade, bell, now = new Date()) {
  if (!bell || bell.enabled === false) return false;
  const parts = String(bell.bellTime || '').split(':').map(Number);
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  const bellAt = new Date(now);
  bellAt.setHours(h, m, 0, 0);
  return now >= bellAt;
}

function stagingZone(radiusMeters = 500) {
  return { radiusMeters, status: 'staged' };
}

module.exports = { canReleaseDriverForGrade, stagingZone };
