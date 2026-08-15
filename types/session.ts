import type {
  ActiveExperience,
  ApprovedExperience,
  CapabilityEntitlement,
  OrganizationMembership,
  PoleSafeRole,
  SessionClaim,
} from './foundation';

export type { SessionClaim };

export function createSessionClaim(claims: SessionClaim): SessionClaim {
  return {
    ...claims,
    approvedCapabilities: claims.approvedCapabilities ?? [],
    approvedExperiences: claims.approvedExperiences ?? [],
    organizationScopes: claims.organizationScopes ?? [],
    sessionVersion: claims.sessionVersion ?? 1,
  };
}

export function bumpSessionVersion(claims: SessionClaim): SessionClaim {
  return { ...claims, sessionVersion: (claims.sessionVersion ?? 0) + 1 };
}

export type {
  ActiveExperience,
  ApprovedExperience,
  CapabilityEntitlement,
  OrganizationMembership,
  PoleSafeRole,
};
