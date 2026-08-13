export type SafetyFallbackChannel = 'app' | 'sms' | 'ussd' | 'webhook';
export type IncidentResolutionState = 'acknowledged' | 'investigating' | 'driver_contacted' | 'parent_contacted' | 'school_contacted' | 'police_contacted' | 'resolved' | 'false_alarm';

export type SafetyRelayPayload = {
  incidentId: string;
  incidentNumber: string;
  channel: SafetyFallbackChannel;
  message: string;
  masked: boolean;
  recipient: 'dispatcher' | 'parent' | 'driver' | 'school' | 'police';
  createdAt: string;
};

export function buildFallbackRelay(payload: Omit<SafetyRelayPayload, 'createdAt'>): SafetyRelayPayload {
  return { ...payload, createdAt: new Date().toISOString() };
}

export function buildUgandaIncidentMessage(input: { incidentNumber: string; status: IncidentResolutionState; routeLabel?: string; vehicleKind?: 'car' | 'boda_boda'; maskedLocation?: string; note?: string; }): string {
  const rideKind = input.vehicleKind === 'boda_boda' ? 'Boda Boda' : input.vehicleKind === 'car' ? 'Car' : 'ride';
  const place = input.maskedLocation || input.routeLabel || 'the route';
  const note = input.note ? ` ${input.note}` : '';
  switch (input.status) {
    case 'acknowledged': return `${input.incidentNumber}: Dispatcher acknowledged the ${rideKind} incident at ${place}.${note}`;
    case 'investigating': return `${input.incidentNumber}: Investigation in progress for the ${rideKind} incident at ${place}.${note}`;
    case 'driver_contacted': return `${input.incidentNumber}: Driver contacted for the ${rideKind} incident at ${place}.${note}`;
    case 'parent_contacted': return `${input.incidentNumber}: Parent contacted for the ${rideKind} incident at ${place}.${note}`;
    case 'school_contacted': return `${input.incidentNumber}: School contacted for the ${rideKind} incident at ${place}.${note}`;
    case 'police_contacted': return `${input.incidentNumber}: Police contacted for the ${rideKind} incident at ${place}.${note}`;
    case 'resolved': return `${input.incidentNumber}: ${rideKind} incident resolved at ${place}.${note}`;
    case 'false_alarm': return `${input.incidentNumber}: ${rideKind} incident marked as false alarm at ${place}.${note}`;
  }
}
