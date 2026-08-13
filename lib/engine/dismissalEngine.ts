export type DismissalBell = { grade: string; bellTime: string; enabled?: boolean };
export function canReleaseDriverForGrade(grade:string, bell:DismissalBell|undefined, now = new Date()){ if(!bell || bell.enabled === false) return false; const [h,m] = bell.bellTime.split(':').map(Number); const bellAt = new Date(now); bellAt.setHours(h, m || 0, 0, 0); return now >= bellAt; }
export function stagingZone(radiusMeters = 500){ return { radiusMeters, status: 'staged' as const }; }
export default { canReleaseDriverForGrade, stagingZone };
