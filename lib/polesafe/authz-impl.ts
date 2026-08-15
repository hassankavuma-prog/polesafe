import type {
  ActiveExperience,
  ApprovedExperienceType,
  CapabilityEntitlement,
  GuardianMembership,
  OrganizationType,
  RoutePolicy,
  RoutePolicyKey,
  SessionClaim,
  TemporaryDelegation,
} from '../../types/foundation';
import { ROUTE_POLICY_MAP } from '../../types/foundation';

export function hasCapability(claims: Pick<SessionClaim, 'approvedCapabilities'> | null | undefined, capability: CapabilityEntitlement['capability']) {
  return !!claims?.approvedCapabilities?.some((entry) => entry.capability === capability && entry.status === 'approved');
}

export function hasExperience(claims: Pick<SessionClaim, 'approvedExperiences'> | null | undefined, experience: ApprovedExperienceType) {
  return !!claims?.approvedExperiences?.some((entry) => entry.experience === experience && entry.status === 'approved');
}

export function getActiveExperience(claims: Pick<SessionClaim, 'activeExperience'> | null | undefined) {
  return claims?.activeExperience?.state === 'selected' ? claims.activeExperience : undefined;
}

export function canAccessExperience(claims: SessionClaim | null | undefined, experience: ApprovedExperienceType) {
  if (!claims) return false;
  const active = getActiveExperience(claims);
  if (active && active.experience === experience) return true;
  return hasExperience(claims, experience);
}

export function can(claims: SessionClaim | null | undefined, capability: CapabilityEntitlement['capability']) {
  return hasCapability(claims, capability);
}

export function canManageOrganization(claims: SessionClaim | null | undefined, organizationType: OrganizationType) {
  if (!claims) return false;
  const approved = claims.organizationScopes?.some((scope) => scope.status === 'approved');
  if (!approved) return false;
  if (organizationType === 'school') return can(claims, 'manage_school_transport') || can(claims, 'verify_school_handoff');
  if (organizationType === 'community') return can(claims, 'manage_community_transport');
  if (organizationType === 'polesafe_internal') return can(claims, 'manage_ops');
  return false;
}

export function canViewChildJourney(claims: SessionClaim | null | undefined, childId: string, context?: { householdId?: string; guardianMembership?: GuardianMembership | null; delegation?: TemporaryDelegation | null; activeExperience?: ActiveExperience | null }) {
  if (!claims) return false;
  if (can(claims, 'manage_household')) return true;
  if (context?.guardianMembership?.status === 'approved' && context.guardianMembership.accountId === claims.accountId && context.guardianMembership.scopes.includes('view_active_child_journey')) return true;
  if (context?.delegation?.status === 'approved' && context.delegation.delegatedToAccountId === claims.accountId && context.delegation.childId === childId) return true;
  if (context?.activeExperience?.state === 'selected' && context.activeExperience.experience === 'my_family' && canAccessExperience(claims, 'my_family')) return true;
  return false;
}

export function canUseRoute(path: RoutePolicyKey, claims: SessionClaim | null | undefined) {
  const policy = ROUTE_POLICY_MAP[path];
  if (!claims) return !!policy.allowDemoFallback;
  if (policy.requiredRoles?.length && claims.role && !policy.requiredRoles.includes(claims.role)) return false;
  if (policy.requiredCapabilities?.length && !policy.requiredCapabilities.every((cap) => can(claims, cap))) return false;
  if (policy.requiredExperiences?.length && !policy.requiredExperiences.some((experience) => canAccessExperience(claims, experience))) return false;
  if (policy.requireApprovedDriver && !can(claims, 'drive')) return false;
  if (policy.requiredOrganizationTypes?.length && !policy.requiredOrganizationTypes.some((org) => canManageOrganization(claims, org))) return false;
  return true;
}

export function getRoutePolicy(path: RoutePolicyKey): RoutePolicy {
  return ROUTE_POLICY_MAP[path];
}
