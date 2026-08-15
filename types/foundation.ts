export type IdentityStatus = 'pending' | 'active' | 'restricted' | 'suspended' | 'deleted';
export type PoleSafeRole = 'rider' | 'parent' | 'driver' | 'school_staff' | 'community_staff' | 'admin_ops' | 'system';
export type CapabilityStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'revoked' | 'expired';
export type PermissionKey =
  | 'booking:create'
  | 'booking:view'
  | 'journey:view'
  | 'child_journey:view'
  | 'child_handoff:verify'
  | 'driver:accept'
  | 'vehicle:assign'
  | 'school:manage_transport'
  | 'community:manage_transport'
  | 'incident:review';
export type ApprovedExperienceType = 'personal_rides' | 'my_family' | 'drive' | 'school' | 'community' | 'admin_ops';
export type ActiveExperienceState = 'selected' | 'blocked' | 'expired';
export type ApprovalLifecycleStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'revoked' | 'expired';
export type HouseholdRole = 'guardian' | 'child' | 'authorized_pickup' | 'authorized_handoff' | 'temporary_delegate';
export type GuardianPrivacyScope = 'view_active_child_journey' | 'view_child_eta_status' | 'receive_child_ride_alerts' | 'view_child_trip_history' | 'authorize_pickup' | 'perform_pickup' | 'perform_handoff' | 'manage_household';
export type OrganizationType = 'school' | 'fleet_provider' | 'community' | 'polesafe_internal' | 'other';
export type OrganizationMembershipRole = 'school_admin' | 'transport_manager' | 'teacher_handoff' | 'gate_staff' | 'community_admin' | 'community_coordinator' | 'fleet_manager' | 'driver' | 'support' | 'owner';
export type DriverApprovalStatus = ApprovalLifecycleStatus;
export type DriverEligibility = 'pending' | 'eligible' | 'ineligible' | 'expired';
export type VehiclePhysicalClass = 'motorcycle' | 'standard_car' | 'large_car' | 'van' | 'minibus' | 'shuttle' | 'bus';
export type LegacyVehicleClass = 'boda' | 'boda_boda' | 'car' | 'taxi' | 'van' | 'bus';
export type VehicleServiceType = 'personal' | 'community' | 'school' | 'shared_carpool' | 'fleet_contract';
export type VehicleServiceApprovalStatus = ApprovalLifecycleStatus;
export type VehicleOwnershipType = 'individual' | 'driver' | 'fleet_company' | 'school' | 'organization' | 'leased' | 'third_party_authorized';
export type VehicleInsuranceStatus = ApprovalLifecycleStatus;
export type VehicleInspectionStatus = ApprovalLifecycleStatus;
export type VehicleActiveStatus = 'active' | 'inactive' | 'maintenance' | 'suspended';

export type AssignmentStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'withdrawn' | 'cancelled' | 'completed';
export type DriverAvailabilityStatus = 'offline' | 'available' | 'offer_received' | 'accepted' | 'en_route_to_pickup' | 'arrived' | 'passenger_onboard' | 'in_trip' | 'handoff_pending' | 'completed';
export type QuoteStatus = 'requested' | 'quoted' | 'countered' | 'accepted' | 'declined' | 'expired' | 'cancelled';
export type PaymentMethod = 'mtn_momo' | 'airtel_money' | 'card' | 'cash';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'reversed' | 'refunded' | 'settling';
export type SettlementStatus = 'healthy' | 'low_balance' | 'settlement_required' | 'cash_restricted' | 'suspended';
export type CancellationStatus = 'requested' | 'confirmed' | 'no_show' | 'failed_pickup' | 'partial_trip' | 'emergency_terminated' | 'cancelled';
export type PickupHandoffVerificationStatus = 'pending' | 'verified' | 'rejected' | 'expired';
export type LocationVisibilityPolicy = 'ride_scoped' | 'always_hidden' | 'emergency_only' | 'explicitly_shared';
export type LocationFreshness = 'live' | 'recent' | 'stale' | 'offline' | 'unknown';
export type MessageDeliveryStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
export type NotificationEventType = 'ride_offer' | 'booking_confirmed' | 'ride_assigned' | 'driver_arriving' | 'pickup_complete' | 'school_arrival' | 'handoff_complete' | 'delay' | 'route_deviation' | 'cancellation' | 'payment' | 'compliance_expiry' | 'school_broadcast' | 'sos';
export type AudioEventType = 'ride_offer' | 'ride_accepted' | 'ride_cancelled' | 'message' | 'handoff_confirmed' | 'payment_received' | 'safety_alert' | 'sos';
export type HamnaActionRisk = 'informational' | 'low' | 'confirmation_required' | 'sensitive' | 'prohibited';
export type EvidenceType = 'audio' | 'video' | 'image' | 'document' | 'telemetry';
export type EvidenceAccessPolicy = 'restricted' | 'ride_scoped' | 'incident_only' | 'legal_hold';
export type EvidenceRetentionPolicy = 'ephemeral' | 'short_term' | 'medium_term' | 'long_term' | 'configurable';

export type RideConfidenceState = 'confirmed' | 'in_transit' | 'delayed' | 'arrived';
export type RideVehicleKind = 'car' | 'boda_boda';

export type AccountIdentity = { id: string; displayName: string; phone: string; email?: string; primaryCountry?: string; status: IdentityStatus; createdAt: string; updatedAt?: string; lastLoginAt?: string; deletionStatus?: 'pending' | 'deleted' | 'restorable'; recoveryMethods?: Array<'phone' | 'email' | 'trusted_device' | 'support_review'>; };
export type RoleGrant = { role: PoleSafeRole; status: ApprovalLifecycleStatus; grantedAt?: string; grantedBy?: string; revokedAt?: string; revokeReason?: string; };
export type CapabilityEntitlement = { capability: 'ride' | 'book_for_self' | 'book_for_child' | 'manage_household' | 'drive' | 'manage_school_transport' | 'verify_school_handoff' | 'manage_community_transport' | 'manage_ops'; status: CapabilityStatus; approvedAt?: string; approvedBy?: string; expiresAt?: string; conditions?: string[]; };
export type PermissionGrant = { permission: PermissionKey; granted: boolean; conditions?: string[]; };
export type ApprovedExperience = { experience: ApprovedExperienceType; status: ApprovalLifecycleStatus; grantedAt?: string; grantedBy?: string; conditions?: string[]; };
export type ActiveExperience = { experience: ApprovedExperienceType; state: ActiveExperienceState; selectedAt: string; contextId?: string; source?: 'user' | 'system' | 'policy'; expiresAt?: string; };
export type Household = { id: string; name?: string; ownerAccountId?: string; status?: ApprovalLifecycleStatus; createdAt?: string; updatedAt?: string; };
export type GuardianMembership = { householdId: string; accountId: string; relationshipLabel?: string; status: ApprovalLifecycleStatus; scopes: GuardianPrivacyScope[]; createdAt?: string; updatedAt?: string; };
export type ChildDependent = { id: string; householdId?: string; displayName: string; dateOfBirth?: string; schoolId?: string; status?: ApprovalLifecycleStatus; safeguardingFlags?: string[]; };
export type AuthorizedPickupPerson = { id: string; childId: string; displayName: string; relationshipLabel?: string; status: ApprovalLifecycleStatus; validFrom?: string; validUntil?: string; };
export type AuthorizedHandoffPerson = { id: string; childId: string; displayName: string; relationshipLabel?: string; status: ApprovalLifecycleStatus; validFrom?: string; validUntil?: string; };
export type TemporaryDelegation = { id: string; childId: string; delegatedFromAccountId: string; delegatedToAccountId: string; scopes: Array<'perform_pickup' | 'perform_handoff' | 'view_child_journey' | 'view_child_eta_status'>; status: ApprovalLifecycleStatus; validFrom: string; validUntil?: string; };
export type OrganizationMembership = { organizationId: string; accountId: string; role: OrganizationMembershipRole; status: ApprovalLifecycleStatus; createdAt?: string; updatedAt?: string; };
export type DriverProfile = { driverId: string; accountId?: string; displayName: string; phone?: string; status?: IdentityStatus; schoolRideEligibility?: DriverEligibility; complianceReferenceIds?: string[]; createdAt?: string; updatedAt?: string; };
export type DriverApproval = { driverId: string; status: DriverApprovalStatus; identityVerificationRefIds?: string[]; licenseVerificationRefIds?: string[]; vehicleVerificationRefIds?: string[]; insuranceVerificationRefIds?: string[]; schoolRideEligibility?: DriverEligibility; reviewNotes?: string; reviewedAt?: string; reviewedBy?: string; expiresAt?: string; };
export type Vehicle = { vehicleId: string; ownerType: VehicleOwnershipType; ownerAccountId?: string; ownerOrganizationId?: string; physicalClass: VehiclePhysicalClass; legacyClasses?: LegacyVehicleClass[]; make?: string; model?: string; year?: number; registrationNumber?: string; country?: string; seatCapacity?: number; usablePassengerSeats?: number; reservedSeats?: number; availableSeats?: number; luggageCapacity?: number; accessibilityFeatures?: string[]; commercialStatus?: 'private' | 'commercial' | 'contracted' | 'school'; schoolTransportEligibility?: DriverEligibility; serviceApprovalStatus?: VehicleServiceApprovalStatus; insuranceStatus?: VehicleInsuranceStatus; inspectionStatus?: VehicleInspectionStatus; activeStatus: VehicleActiveStatus; serviceTypes?: VehicleServiceType[]; serviceEligibility?: VehicleServiceEligibility[]; fleetProviderId?: string; createdAt?: string; updatedAt?: string; };
export type VehicleServiceEligibility = { serviceType: VehicleServiceType; approved: boolean; status?: VehicleServiceApprovalStatus; requiresInspection?: boolean; requiresInsurance?: boolean; minSeats?: number; maxSeats?: number; requiresSchoolApproval?: boolean; jurisdiction?: string; serviceAreaIds?: string[]; notes?: string[]; };
export type DriverVehicleAssignment = { assignmentId: string; driverId: string; vehicleId: string; status: AssignmentStatus; sourceType?: 'driver_owned' | 'fleet_assigned' | 'school_assigned' | 'temporary_substitute'; validFrom: string; validUntil?: string; assignedBy?: string; assignedAt?: string; };
export type FleetProvider = { providerId: string; organizationId?: string; providerType: 'independent_driver' | 'taxi_operator' | 'fleet_company' | 'school_owned' | 'contracted_school_provider' | 'bus_operator' | 'minibus_operator'; displayName?: string; supportedServiceTypes?: VehicleServiceType[]; serviceAreaIds?: string[]; activeStatus?: ApprovalLifecycleStatus; };
export type ServiceAreaType = 'city' | 'district' | 'region' | 'market' | 'country';
export type ServiceArea = { id: string; name: string; type: ServiceAreaType; country?: string; region?: string; district?: string; activeStatus?: ApprovalLifecycleStatus; };
export type RideRequest = { rideRequestId: string; requestedByAccountId: string; serviceType: VehicleServiceType; passengerCount?: number; requiredCapacity?: number; pickupLocation?: string; dropoffLocation?: string; serviceAreaId?: string; scheduledFor?: string; recurring?: boolean; status?: ApprovalLifecycleStatus; };
export type Passenger = { passengerId: string; accountId?: string; childId?: string; displayName: string; passengerType: 'account' | 'child' | 'guest'; seatRequirement?: number; accessibilityRequirementRef?: string; };
export type Booking = { bookingId: string; rideRequestId?: string; status: ApprovalLifecycleStatus; passengerCount?: number; reservedSeats?: number; availableSeats?: number; providerId?: string; vehicleId?: string; driverId?: string; };
export type Assignment = { assignmentId: string; bookingId: string; driverId?: string; vehicleId?: string; providerId?: string; status: AssignmentStatus; offeredAt?: string; respondedAt?: string; };
export type Journey = { journeyId: string; bookingId?: string; assignmentId?: string; status?: 'planned' | 'boarding' | 'in_progress' | 'arrived' | 'completed' | 'cancelled' | 'incident'; startAt?: string; endAt?: string; currentLocationLabel?: string; };
export type JourneyCheckpoint = { checkpointId: string; journeyId: string; label: string; type: 'pickup' | 'route_point' | 'school_gate' | 'dropoff' | 'stop' | 'sos'; reachedAt?: string; confidence?: RideConfidenceState; };
export type TransportQuoteRequest = { quoteRequestId: string; rideRequestId: string; requestedByAccountId: string; passengerCount?: number; requiredCapacity?: number; serviceType?: VehicleServiceType; serviceAreaId?: string; status?: QuoteStatus; };
export type TransportQuote = { quoteId: string; quoteRequestId: string; providerId: string; status: QuoteStatus; quotedFare?: number; providerGross?: number; platformFee?: number; providerNet?: number; expiresAt?: string; counterofferOfQuoteId?: string; };
export type DriverAvailability = { driverId: string; status: DriverAvailabilityStatus; updatedAt: string; metadata?: Record<string, unknown>; };
export type RideOffer = { offerId: string; rideRequestId: string; driverId?: string; vehicleId?: string; status: AssignmentStatus; offeredAt: string; expiresAt?: string; metadata?: Record<string, unknown>; };
export type ProviderType = 'individual_driver' | 'parent_driver' | 'fleet_operator' | 'taxi_operator' | 'van_operator' | 'bus_operator' | 'school_owned' | 'contracted_school_provider';
export type Provider = { providerId: string; providerType: ProviderType; organizationId?: string; displayName?: string; serviceAreaIds?: string[]; supportedServiceTypes?: VehicleServiceType[]; vehicleIds?: string[]; driverIds?: string[]; activeStatus?: ApprovalLifecycleStatus; };
export type Payment = { paymentId: string; bookingId?: string; rideRequestId?: string; payerAccountId?: string; providerId?: string; method: PaymentMethod; status: PaymentStatus; amount?: number; currency?: string; };
export type PaymentTransaction = { transactionId: string; paymentId: string; method: PaymentMethod; status: PaymentStatus; externalReference?: string; amount?: number; createdAt?: string; };
export type PlatformFee = { id: string; paymentId?: string; bookingId?: string; amount?: number; currency?: string; status?: PaymentStatus; };
export type ProviderSettlement = { settlementId: string; providerId: string; providerGross?: number; platformFee?: number; providerNet?: number; amountOwedToPoleSafe?: number; cashCollected?: number; officialFare?: number; settlementStatus: SettlementStatus; walletBalance?: number; };
export type ProviderWallet = { walletId: string; providerId: string; balance: number; currency?: string; settlementStatus: SettlementStatus; };
export type RefundAdjustment = { adjustmentId: string; paymentId?: string; bookingId?: string; amount: number; currency?: string; reason?: string; status?: 'pending' | 'approved' | 'rejected' | 'completed'; };
export type PricingConfiguration = { pricingId: string; serviceAreaId?: string; vehicleClass?: VehiclePhysicalClass; capacity?: number; serviceType?: VehicleServiceType; factors?: Array<'distance' | 'time' | 'pickup_distance' | 'scheduled' | 'recurring' | 'waiting' | 'tolls' | 'parking' | 'multiple_stops' | 'cancellation'>; riderFare?: number; providerGross?: number; platformFee?: number; providerNet?: number; };
export type CancellationEvent = { cancellationId: string; bookingId?: string; journeyId?: string; status: CancellationStatus; reason?: string; actorAccountId?: string; };
export type PickupVerification = { verificationId: string; journeyId: string; childId?: string; verifiedByAccountId?: string; status: PickupHandoffVerificationStatus; verifiedAt?: string; method?: string; };
export type HandoffVerification = { verificationId: string; journeyId: string; childId?: string; verifiedByAccountId?: string; status: PickupHandoffVerificationStatus; verifiedAt?: string; method?: string; };
export type ConsentRecord = { consentId: string; childId: string; grantedByAccountId: string; grantedToAccountId?: string; scopes?: Array<'perform_pickup' | 'perform_handoff' | 'view_child_journey' | 'view_child_eta_status'>; status: ApprovalLifecycleStatus; validFrom?: string; validUntil?: string; };
export type DelegatedAuthority = { delegationId: string; consentId?: string; childId: string; delegatedByAccountId: string; delegatedToAccountId: string; scopes: Array<'perform_pickup' | 'perform_handoff' | 'view_child_journey' | 'view_child_eta_status'>; status: ApprovalLifecycleStatus; validFrom: string; validUntil?: string; };
export type LocationPolicy = { locationPolicyId: string; visibility: LocationVisibilityPolicy; freshness: LocationFreshness; retentionPolicyRef?: string; };
export type CommunicationThread = { threadId: string; participantAccountIds: string[]; contextType?: 'booking' | 'journey' | 'incident' | 'support'; contextId?: string; status?: ApprovalLifecycleStatus; };
export type Message = { messageId: string; threadId: string; senderAccountId: string; body: string; deliveryStatus: MessageDeliveryStatus; createdAt: string; };
export type NotificationEvent = { notificationId: string; eventType: NotificationEventType; recipientAccountId?: string; recipientOrganizationId?: string; status?: MessageDeliveryStatus; createdAt: string; };
export type AudioEvent = { eventType: AudioEventType; reason?: string; };
export type HamnaSession = { sessionId: string; accountId?: string; activeExperience?: ApprovedExperienceType; status?: ApprovalLifecycleStatus; };
export type HamnaIntent = { intentId: string; name: string; risk: HamnaActionRisk; };
export type SafetyEvidence = { evidenceId: string; type: EvidenceType; accessPolicy: EvidenceAccessPolicy; retentionPolicy: EvidenceRetentionPolicy; relatedIncidentId?: string; };
export type Incident = { incidentId: string; bookingId?: string; journeyId?: string; paymentId?: string; communicationThreadId?: string; evidenceIds?: string[]; status?: ApprovalLifecycleStatus; severity?: string; };
export type SupportCase = { caseId: string; incidentId?: string; bookingId?: string; journeyId?: string; paymentId?: string; communicationThreadId?: string; status?: ApprovalLifecycleStatus; };
export type AuditEvent = { auditEventId: string; actorAccountId?: string; action: string; resourceType: string; resourceId?: string; createdAt: string; metadata?: Record<string, unknown>; };

export type SessionScope = 'account' | 'organization' | 'household' | 'journey' | 'support';
export type SessionClaim = {
  accountId: string;
  approvedCapabilities: CapabilityEntitlement[];
  approvedExperiences: ApprovedExperience[];
  activeExperience?: ActiveExperience;
  organizationScopes?: OrganizationMembership[];
  sessionVersion: number;
  scope?: SessionScope;
  role?: PoleSafeRole;
};

export type RoutePolicyKey = '/parent' | '/driver' | '/school' | '/ops' | '/dispatch' | '/compliance';
export type RoutePolicy = {
  path: RoutePolicyKey;
  requiredCapabilities?: CapabilityEntitlement['capability'][];
  requiredExperiences?: ApprovedExperienceType[];
  requiredRoles?: PoleSafeRole[];
  requiredOrganizationTypes?: OrganizationType[];
  requireApprovedDriver?: boolean;
  allowDemoFallback?: boolean;
};

export const ROUTE_POLICY_MAP: Record<RoutePolicyKey, RoutePolicy> = {
  '/parent': { path: '/parent', requiredCapabilities: ['ride', 'book_for_self', 'book_for_child', 'manage_household'], requiredExperiences: ['personal_rides', 'my_family'], requiredRoles: ['rider', 'parent'], allowDemoFallback: true },
  '/driver': { path: '/driver', requiredCapabilities: ['drive'], requiredExperiences: ['drive'], requiredRoles: ['driver'], requireApprovedDriver: true, allowDemoFallback: true },
  '/school': { path: '/school', requiredCapabilities: ['manage_school_transport', 'verify_school_handoff'], requiredExperiences: ['school'], requiredRoles: ['school_staff', 'admin_ops'], requiredOrganizationTypes: ['school'], allowDemoFallback: true },
  '/ops': { path: '/ops', requiredCapabilities: ['manage_ops'], requiredExperiences: ['admin_ops'], requiredRoles: ['admin_ops', 'system'], requiredOrganizationTypes: ['polesafe_internal'], allowDemoFallback: true },
  '/dispatch': { path: '/dispatch', requiredCapabilities: ['manage_ops', 'manage_community_transport'], requiredExperiences: ['community'], requiredRoles: ['admin_ops', 'community_staff', 'system'], requiredOrganizationTypes: ['community', 'fleet_provider', 'polesafe_internal'], allowDemoFallback: true },
  '/compliance': { path: '/compliance', requiredCapabilities: ['manage_ops'], requiredExperiences: ['admin_ops'], requiredRoles: ['admin_ops', 'system'], requiredOrganizationTypes: ['polesafe_internal', 'community', 'school'], allowDemoFallback: true },
};

export function getRoutePolicy(path: RoutePolicyKey): RoutePolicy {
  return ROUTE_POLICY_MAP[path];
}
