import type { RideAlertEvent, RideAlertType, RideConfidenceState, RideVehicleKind, LiveJourneyState } from '../../types/polesafe';

export type RideTelemetryPoint = {
  rideId: string;
  latitude: number;
  longitude: number;
  speedKph?: number;
  timestamp: string;
  heading?: number;
  accuracyMeters?: number;
  vehicleKind: RideVehicleKind;
  currentZone?: 'home_gate' | 'school_gate' | 'route' | 'unknown';
};

export type RideRoutePlan = {
  rideId: string;
  routeName: string;
  homeGateLabel: string;
  schoolGateLabel: string;
  plannedStops?: Array<{ label: string; latitude: number; longitude: number; maxStopSeconds?: number }>;
  allowedStopSeconds?: number;
  vehicleKind: RideVehicleKind;
};

export function deriveRideConfidence(state: Pick<LiveJourneyState, 'confidenceState' | 'geofenceStatus' | 'currentStopSeconds' | 'plannedStopSeconds' | 'speedKph' | 'activeAlertTypes'>): RideConfidenceState {
  if (state.geofenceStatus === 'inside' && (state.confidenceState === 'arrived' || state.activeAlertTypes?.includes('geofence_arrival'))) return 'arrived';
  if (state.currentStopSeconds && state.plannedStopSeconds && state.currentStopSeconds > state.plannedStopSeconds) return 'delayed';
  if (state.activeAlertTypes?.includes('route_deviation') || state.activeAlertTypes?.includes('unscheduled_stop')) return 'delayed';
  if ((state.speedKph ?? 0) > 0) return state.confidenceState === 'confirmed' ? 'in_transit' : state.confidenceState;
  return state.confidenceState;
}

export function evaluateJourneyTelemetry(input: {
  state: LiveJourneyState;
  route: RideRoutePlan;
  telemetry: RideTelemetryPoint;
  routeToleranceMeters?: number;
}): { nextState: LiveJourneyState; alerts: RideAlertEvent[] } {
  const alerts: RideAlertEvent[] = [];
  const routeToleranceMeters = input.routeToleranceMeters ?? 180;
  const geofenceHit = input.telemetry.currentZone === 'home_gate' || input.telemetry.currentZone === 'school_gate';

  let confidenceState: RideConfidenceState = input.state.confidenceState;
  let geofenceStatus: LiveJourneyState['geofenceStatus'] = input.state.geofenceStatus ?? 'approaching';

  if (geofenceHit) {
    confidenceState = 'arrived';
    geofenceStatus = 'inside';
    alerts.push({
      alertId: `alert-${input.state.rideId}-geofence`,
      rideId: input.state.rideId,
      alertType: 'geofence_arrival',
      severity: 'low',
      message: `Ride reached ${input.telemetry.currentZone === 'home_gate' ? input.route.homeGateLabel : input.route.schoolGateLabel}`,
      maskedLocation: input.state.currentLocationLabel,
      parentNotified: true,
      adminNotified: true,
      dispatchNotified: true,
      confidence: 'confirmed',
      createdAt: input.telemetry.timestamp,
    });
  }

  if ((input.state.currentStopSeconds ?? 0) > (input.state.plannedStopSeconds ?? input.route.allowedStopSeconds ?? 300)) {
    confidenceState = 'delayed';
    alerts.push({
      alertId: `alert-${input.state.rideId}-stop`,
      rideId: input.state.rideId,
      alertType: 'unscheduled_stop',
      severity: input.state.vehicleKind === 'boda_boda' ? 'critical' : 'high',
      message: 'Unscheduled stop exceeded route threshold',
      maskedLocation: input.state.currentLocationLabel,
      parentNotified: true,
      adminNotified: true,
      dispatchNotified: true,
      confidence: 'delayed',
      createdAt: input.telemetry.timestamp,
    });
  }

  const routeDeviation = (input.telemetry.accuracyMeters ?? 0) > routeToleranceMeters;
  if (routeDeviation) {
    confidenceState = 'delayed';
    alerts.push({
      alertId: `alert-${input.state.rideId}-deviation`,
      rideId: input.state.rideId,
      alertType: 'route_deviation',
      severity: input.state.vehicleKind === 'boda_boda' ? 'critical' : 'high',
      message: 'Vehicle deviated from planned route corridor',
      maskedLocation: input.state.currentLocationLabel,
      parentNotified: true,
      adminNotified: true,
      dispatchNotified: true,
      confidence: 'inferred',
      createdAt: input.telemetry.timestamp,
    });
  }

  const nextState: LiveJourneyState = {
    ...input.state,
    confidenceState: deriveRideConfidence({
      confidenceState,
      geofenceStatus,
      currentStopSeconds: input.state.currentStopSeconds,
      plannedStopSeconds: input.state.plannedStopSeconds,
      speedKph: input.telemetry.speedKph,
      activeAlertTypes: alerts.map((alert) => alert.alertType),
    }),
    geofenceStatus,
    speedKph: input.telemetry.speedKph,
    currentLocationLabel: input.state.currentLocationLabel ?? input.route.routeName,
    activeAlertTypes: Array.from(new Set([...(input.state.activeAlertTypes ?? []), ...alerts.map((alert) => alert.alertType)])),
    confidence: alerts.length ? 'delayed' : input.state.confidence,
    confidenceNote: alerts.length ? alerts.map((a) => a.message).join('; ') : input.state.confidenceNote,
    confidenceUpdatedAt: input.telemetry.timestamp,
  };

  return { nextState, alerts };
}

export function buildSOSAlert(input: {
  rideId: string;
  driverId: string;
  parentId: string;
  vehicleKind: RideVehicleKind;
  maskedLocation?: string;
  reason: string;
  timestamp: string;
}): RideAlertEvent {
  return {
    alertId: `alert-${input.rideId}-sos-${Date.now()}`,
    rideId: input.rideId,
    alertType: 'sos',
    severity: 'critical',
    message: input.reason,
    maskedLocation: input.maskedLocation,
    parentNotified: true,
    adminNotified: true,
    dispatchNotified: true,
    confidence: 'confirmed',
    confidenceNote: `${input.vehicleKind === 'boda_boda' ? 'Boda rider' : 'Car driver'} SOS escalated`,
    confidenceSource: 'driver_panic_button',
    confidenceUpdatedAt: input.timestamp,
    createdAt: input.timestamp,
  };
}
