import type { LiveJourneyState, RideAlertEvent } from '../../types/polesafe';

export type RideSnapshot = {
  state: LiveJourneyState;
  alerts: RideAlertEvent[];
  updatedAt: string;
};

const rides = new Map<string, RideSnapshot>();

export function getRideSnapshot(rideId: string): RideSnapshot | undefined {
  return rides.get(rideId);
}

export function upsertRideSnapshot(snapshot: RideSnapshot): RideSnapshot {
  rides.set(snapshot.state.rideId, snapshot);
  return snapshot;
}

export function listRideSnapshots(): RideSnapshot[] {
  return Array.from(rides.values());
}
