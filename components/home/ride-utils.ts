export function humanizeRideStatus(status?: string | null) {
  switch (status) {
    case 'assigned': return 'Driver assigned';
    case 'arrived': return 'Driver arrived';
    case 'pickup_verified': return 'Pickup confirmed';
    case 'in_progress': return 'Journey in progress';
    case 'completed': return 'Journey completed';
    case 'cancelled': return 'Ride cancelled';
    default: return status ? status.replace(/_/g, ' ') : 'Status unavailable';
  }
}

function formatRelativeMinutes(minutes: number) {
  if (minutes <= 0) return 'just now';
  if (minutes === 1) return '1 minute ago';
  return `${minutes} minutes ago`;
}

export function freshnessFromTimestamp(timestamp?: string | null) {
  if (!timestamp) return { label: 'UNKNOWN', detail: 'Location unavailable' };
  const ms = new Date(timestamp).getTime();
  if (Number.isNaN(ms)) return { label: 'UNKNOWN', detail: 'Location unavailable' };
  const ageMinutes = Math.max(0, Math.floor((Date.now() - ms) / 60000));
  if (ageMinutes <= 2) return { label: 'LIVE', detail: `Updated ${formatRelativeMinutes(ageMinutes)}` };
  if (ageMinutes <= 15) return { label: 'RECENT', detail: `Updated ${formatRelativeMinutes(ageMinutes)}` };
  return { label: 'STALE', detail: `Updated ${formatRelativeMinutes(ageMinutes)}; location may be stale` };
}
