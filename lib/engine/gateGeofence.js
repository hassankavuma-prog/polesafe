function metersBetween(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function matchGate(position, gates, radius = 200) {
  return (gates || [])
    .map(g => ({
      gateId: g._id,
      gateName: g.name,
      radius: g.radius || radius,
      distance: metersBetween(position.lat, position.lng, g.lat, g.lng),
    }))
    .filter(g => g.distance <= g.radius)
    .sort((a, b) => a.distance - b.distance)[0] || null;
}

module.exports = { metersBetween, matchGate };
