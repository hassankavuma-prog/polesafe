export type IdentityStatus = 'pending' | 'active' | 'restricted' | 'suspended' | 'deleted';
export type PoleSafeRole = 'rider' | 'parent' | 'driver' | 'school_staff' | 'community_staff' | 'admin_ops' | 'system';
export type CapabilityStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'revoked' | 'expired';
export type PermissionKey = 'booking:create' | 'booking:view' | 'journey:view' | 'child_journey:view' | 'child_handoff:verify' | 'driver:accept' | 'vehicle:assign' | 'school:manage_transport' | 'community:manage_transport' | 'incident:review';
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
export type RideRequestStatus = 'draft' | 'submitted' | 'searching' | 'quote_required' | 'quoted' | 'matched' | 'cancelled' | 'expired' | 'rejected';
export type RideTimingType = 'immediate' | 'scheduled' | 'recurring';
export type RideTripPattern = 'one_way' | 'return';
export type RideStopType = 'pickup' | 'intermediate' | 'destination';
export type RidePassengerRole = 'booker' | 'payer' | 'passenger' | 'guardian';
export type RidePassenger = { passengerId?: string; accountId?: string; childId?: string; displayName?: string; role?: RidePassengerRole; seatRequirement?: number; isPrimary?: boolean; notes?: string; };
export type PassengerRequirements = { totalPassengerCount: number; adultCount?: number; childCount?: number; infantCount?: number; requiredSeats: number; passengers?: RidePassenger[]; luggageRequirements?: string[]; accessibilityRequirements?: string[]; childSeatRequirements?: string[]; };
export type RideStop = { id?: string; order: number; type: RideStopType; location: string; contactReference?: string; plannedArrivalAt?: string; notes?: string; status?: 'planned' | 'confirmed' | 'arrived' | 'skipped' | 'cancelled'; };
export type RideTiming = { type: RideTimingType; tripPattern: RideTripPattern; requestedPickupAt?: string; pickupWindowStart?: string; pickupWindowEnd?: string; timezone?: string; returnPickupAt?: string; scheduleId?: string; recurrenceReference?: string; };
export type RideLegLink = { outboundRideRequestId?: string; returnRideRequestId?: string; linkedRideRequestIds?: string[]; relation?: 'outbound' | 'return' | 'paired' | 'multi_leg'; };
export type TransportPlanCadence = 'one_day' | 'weekly' | 'multi_week' | 'monthly' | 'full_term' | 'custom_range';
export type TransportPlanFrequency = 'morning_only' | 'return_only' | 'morning_and_return';
export type TransportPlanPauseState = 'active' | 'paused';
export type TransportPlanExceptionType = 'student_exception' | 'guardian_self_pickup' | 'absence' | 'route_change' | 'pickup_change' | 'dropoff_change' | 'temporary_suspension' | 'special_day_override' | 'holiday' | 'exam_schedule' | 'emergency_closure';
export type TransportPlanOccurrenceStatus = 'planned' | 'skipped' | 'changed' | 'suspended' | 'completed' | 'pending';
export type TransportScheduleRecurrence = { cadence: TransportPlanCadence; startDate?: string; endDate?: string; termReference?: string; selectedWeekdays?: Array<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'>; schoolHolidayExceptions?: string[]; examScheduleExceptions?: string[]; specialDayExceptions?: string[]; };
export type ScheduleTargetType = 'school' | 'campus' | 'class' | 'student' | 'student_group' | 'route' | 'vehicle' | 'day_of_week' | 'date' | 'school_term' | 'date_range' | 'calendar_day';
export type ScheduleEventType = 'morning_pickup' | 'school_arrival' | 'afternoon_dismissal' | 'return_pickup' | 'after_school_activity' | 'exam_pickup' | 'special_event' | 'boarding_term_transport' | 'custom_transport_event';
export type ScheduleChangeType = 'create' | 'update' | 'delete' | 'activate' | 'deactivate' | 'override' | 'exception' | 'acknowledgement';
export type ScheduleAcknowledgementState = 'not_required' | 'pending' | 'acknowledged' | 'declined' | 'expired';
export type ScheduleImpactType = 'route' | 'driver' | 'vehicle' | 'pickup_window' | 'handoff_timing' | 'assignment';
export type ScheduleSourceType = 'manual' | 'school_admin' | 'transport_manager' | 'teacher_handoff' | 'gate_staff' | 'imported' | 'offline_device';
export type ScheduleConflictStatus = 'clean' | 'pending_sync' | 'conflict' | 'resolved';
export type ScheduleActorContext = { organizationId?: string; householdId?: string; role?: OrganizationMembershipRole | PoleSafeRole; schoolId?: string; campusId?: string; routeId?: string; deviceId?: string; };
export type ScheduleTarget = { type: ScheduleTargetType; id?: string; ids?: string[]; label?: string; metadata?: Record<string, unknown>; };
export type SchedulePolicyReference = { cutoffTime?: string; approvalRequired?: boolean; approverRole?: OrganizationMembershipRole | PoleSafeRole; approverCapability?: CapabilityEntitlement['capability']; lateChangeHandling?: 'allow' | 'allow_with_acknowledgement' | 'deny' | 'require_approval'; };
export type ScheduleRule = { id?: string; priority?: number; eventType: ScheduleEventType; targets: ScheduleTarget[]; startDate?: string; endDate?: string; dayOfWeek?: Array<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'>; termReference?: string; effectiveAt?: string; timezone?: string; transportTiming?: RideTiming; pickupWindowStart?: string; pickupWindowEnd?: string; notes?: string; active?: boolean; cadence?: TransportPlanCadence; frequency?: TransportPlanFrequency; };
export type ScheduleException = { id?: string; scheduleId: string; occurrenceId?: string; childId?: string; requestedByAccountId?: string; type: TransportPlanExceptionType; reason?: string; effectiveAt?: string; expiresAt?: string; approvalState?: ScheduleAcknowledgementState; resultingTransportStatus?: TransportPlanOccurrenceStatus; };
export type ScheduleOverride = { id?: string; scheduleId: string; baseRuleId?: string; exceptionId?: string; priority?: number; effectiveAt?: string; expiresAt?: string; notes?: string; };
export type ScheduleChange = { id: string; scheduleId: string; actorAccountId?: string; actorContext?: ScheduleActorContext; changeType: ScheduleChangeType; previousValue?: string; previousReferenceId?: string; newValue?: string; newReferenceId?: string; reason?: string; changedAt: string; effectiveAt?: string; affectedTargets?: ScheduleTarget[]; impactTypes?: ScheduleImpactType[]; source?: ScheduleSourceType; auditEventId?: string; offlineCreated?: boolean; sourceDeviceId?: string; syncedAt?: string; conflictStatus?: ScheduleConflictStatus; };
export type ScheduleAcknowledgement = { id?: string; scheduleId: string; occurrenceId?: string; childId?: string; guardianAccountId?: string; state: ScheduleAcknowledgementState; requestedByAccountId?: string; requestedAt?: string; respondedAt?: string; reason?: string; notificationEventId?: string; };
export type TransportSchedule = { id: string; schoolId?: string; campusId?: string; routeId?: string; vehicleId?: string; scheduleTermReference?: string; recurringPlan?: TransportScheduleRecurrence; childIds?: string[]; guardianAccountIds?: string[]; cadence?: TransportPlanCadence; frequency?: TransportPlanFrequency; startDate?: string; endDate?: string; termReference?: string; selectedWeekdays?: Array<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'>; morningPickupTime?: string; returnPickupTime?: string; routeServiceId?: string; temporaryPauseState?: TransportPlanPauseState; pauseStartAt?: string; pauseEndAt?: string; rules: ScheduleRule[]; exceptions?: ScheduleException[]; overrides?: ScheduleOverride[]; acknowledgements?: ScheduleAcknowledgement[]; policies?: SchedulePolicyReference[]; changes?: ScheduleChange[]; status?: 'active' | 'inactive' | 'draft'; createdAt: string; updatedAt?: string; timezone?: string; };
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
export type RideRequest = { id: string; requestedByAccountId: string; householdId?: string; organizationId?: string; serviceType: VehicleServiceType; passengerRequirements: PassengerRequirements; pickup: RideStop; destination: RideStop; stops?: RideStop[]; timing: RideTiming; requestedVehicleClass?: VehiclePhysicalClass; requiredCapacity: number; notes?: string; bookingForSomeoneElse?: boolean; payerAccountId?: string; status: RideRequestStatus; createdAt: string; expiresAt?: string; serviceAreaId?: string; legLink?: RideLegLink; };
export type Booking = { bookingId: string; rideRequestId?: string; status: ApprovalLifecycleStatus; passengerCount?: number; reservedSeats?: number; availableSeats?: number; providerId?: string; vehicleId?: string; driverId?: string; };
export type Assignment = { assignmentId: string; bookingId: string; driverId?: string; vehicleId?: string; providerId?: string; status: AssignmentStatus; offeredAt?: string; respondedAt?: string; };
export type JourneyLifecycleStatus = 'scheduled' | 'searching' | 'driver_assigned' | 'driver_en_route' | 'driver_arrived' | 'pickup_verification' | 'passenger_onboard' | 'in_trip' | 'delayed' | 'handoff_pending' | 'completed' | 'cancelled' | 'interrupted' | 'emergency';
export type JourneyCheckpointType = 'assignment_confirmed' | 'driver_departed' | 'driver_arrived_pickup' | 'pickup_verified' | 'passenger_boarded' | 'route_checkpoint' | 'school_gate_arrival' | 'handoff_pending' | 'handoff_verified' | 'trip_completed';
export type ChildJourneyAccessScope = 'active_journey_only' | 'active_plus_recent_history' | 'emergency_only' | 'explicitly_shared' | 'hidden';
export type JourneyVisibilityGrant = { id?: string; journeyId: string; childId: string; guardianAccountId: string; scope: ChildJourneyAccessScope; grantedByAccountId?: string; grantedAt?: string; revokedAt?: string; source?: 'guardian_membership' | 'explicit_permission' | 'ride_relationship' | 'school_authorization'; };
export type Journey = { journeyId: string; bookingId?: string; assignmentId?: string; driverId?: string; vehicleId?: string; providerId?: string; status?: JourneyLifecycleStatus; startedAt?: string; driverArrivedAt?: string; pickupVerificationId?: string; passengerOnboardAt?: string; handoffVerificationId?: string; handoffPendingAt?: string; completedAt?: string; cancelledAt?: string; currentLocation?: { label?: string; latitude?: number; longitude?: number; visibility?: LocationVisibilityPolicy | ChildJourneyAccessScope; }; locationFreshness?: LocationFreshness; etaMinutes?: number; activeAlertReferences?: string[]; checkpointReferences?: string[]; interruptionReason?: string; incidentIds?: string[]; childId?: string; guardianVisibilityGrants?: JourneyVisibilityGrant[]; cancellationReferenceId?: string; createdAt: string; updatedAt?: string; };
export type JourneyCheckpoint = { checkpointId: string; journeyId: string; label: string; type: JourneyCheckpointType | 'pickup' | 'route_point' | 'school_gate' | 'dropoff' | 'stop' | 'sos'; reachedAt?: string; confidence?: RideConfidenceState; };
export type ChildJourneyAccess = JourneyVisibilityGrant;
export type TransportQuoteRequest = { quoteRequestId: string; rideRequestId: string; requestedByAccountId: string; passengerCount?: number; requiredCapacity?: number; serviceType?: VehicleServiceType; serviceAreaId?: string; status?: QuoteStatus; acceptedQuoteId?: string; bookingId?: string; };
export type TransportQuote = { quoteId: string; quoteRequestId: string; providerId: string; status: QuoteStatus; quotedFare?: number; providerGross?: number; platformFee?: number; providerNet?: number; expiresAt?: string; counterofferOfQuoteId?: string; acceptedBookingId?: string; };
export type DriverAvailability = { driverId: string; status: DriverAvailabilityStatus; updatedAt: string; metadata?: Record<string, unknown>; };
export type MatchingPolicyReference = {
  policyId?: string;
  policyVersion?: string;
  effectiveAt?: string;
  expiresAt?: string;
  rulesetReference?: string;
  overrideReference?: string;
};

export type MatchingIdempotencyReference = {
  idempotencyKey: string;
  requestId?: string;
  correlationId?: string;
  dedupeKey?: string;
  createdAt?: string;
};

export type MatchingConcurrencyReference = {
  revision?: string | number;
  version?: number;
  etag?: string;
  requestVersion?: string;
  resourceVersion?: string;
};

export type DriverAvailabilityWindow = {
  startAt: string;
  endAt?: string;
  timezone?: string;
  recurringPattern?: string;
  source?: 'driver_declared' | 'provider_declared' | 'schedule' | 'system';
};

export type MatchingLocationState = {
  freshness?: LocationFreshness;
  connectivityState?: 'connected' | 'intermittent' | 'weak' | 'offline' | 'unknown';
  isStale?: boolean;
  updatedAt?: string;
  observedAt?: string;
  source?: 'gps' | 'landmark' | 'saved_place' | 'school_gate' | 'campus_pickup_point' | 'stage' | 'pickup_zone' | 'named_area' | 'manual_confirmation';
  referenceLabel?: string;
};

export type MatchingScheduleConflictReference = {
  scheduleId?: string;
  occurrenceId?: string;
  conflictStatus?: ScheduleConflictStatus;
  conflictType?: 'driver' | 'vehicle' | 'route' | 'school' | 'booked_ride' | 'assignment' | 'journey';
  referenceIds?: string[];
  notes?: string;
};

export type MatchingFeasibilityReference = {
  pickupFeasible?: boolean;
  deadheadFeasible?: boolean;
  pickupDistanceMeters?: number;
  pickupEstimatedMinutes?: number;
  deadheadDistanceMeters?: number;
  deadheadEstimatedMinutes?: number;
  referencePoint?: string;
  referenceType?: 'gps' | 'landmark' | 'saved_place' | 'school_gate' | 'campus_pickup_point' | 'stage' | 'pickup_zone' | 'named_area' | 'manual_confirmation';
  notes?: string;
};

export type MatchingCapacitySnapshot = {
  passengerCount?: number;
  requiredSeats: number;
  registeredCapacity?: number;
  availableSeats?: number;
  luggageRequirement?: string[];
  accessibilityRequirements?: string[];
  childTransportRequired?: boolean;
  schoolTransportRequired?: boolean;
  negotiatedTransportRequired?: boolean;
};

export type MatchingAvailabilitySnapshot = {
  driverAvailability?: DriverAvailabilityStatus;
  driverWindows?: DriverAvailabilityWindow[];
  vehicleActiveStatus?: VehicleActiveStatus;
  vehicleAvailability?: 'available' | 'unavailable' | 'restricted' | 'maintenance' | 'unknown';
  providerStatus?: ApprovalLifecycleStatus;
  serviceAreaIds?: string[];
  scheduleConflictReferences?: MatchingScheduleConflictReference[];
  activeJourneyConflict?: boolean;
};

export type MatchingCandidateSnapshot = {
  driverId?: string;
  vehicleId?: string;
  providerId?: string;
  fleetProviderId?: string;
  evaluatedAt: string;
  location?: MatchingLocationState;
  capacity?: MatchingCapacitySnapshot;
  availability?: MatchingAvailabilitySnapshot;
  policy?: MatchingPolicyReference;
  eligibility?: EligibilityEvaluation;
  pricingResult?: PricingResult;
  paymentMethodSupport?: PaymentMethod[];
  idempotency?: MatchingIdempotencyReference;
  concurrency?: MatchingConcurrencyReference;
};

export type EligibilityDecision = 'eligible' | 'ineligible' | 'manual_review' | 'unknown';
export type EligibilityFailureReason = 'driver_not_approved' | 'vehicle_not_approved' | 'provider_inactive' | 'insufficient_capacity' | 'capability_missing' | 'child_transport_not_authorized' | 'school_transport_not_authorized' | 'service_area_mismatch' | 'driver_unavailable' | 'vehicle_unavailable' | 'schedule_conflict' | 'active_journey_conflict' | 'location_stale' | 'pickup_not_feasible' | 'payment_method_unsupported' | 'provider_restricted' | 'negotiated_transport_required' | 'policy_restriction' | 'unknown';

export type EligibilityCriterion = {
  code: string;
  label?: string;
  category?: 'driver' | 'vehicle' | 'provider' | 'passenger' | 'child' | 'school' | 'location' | 'schedule' | 'payment' | 'policy';
  required?: boolean;
  satisfied?: boolean;
  failureReason?: EligibilityFailureReason;
  evidenceReferences?: string[];
  notes?: string;
};

export type EligibilityEvaluation = {
  decision: EligibilityDecision;
  hardEligible: boolean;
  softEligible?: boolean;
  evaluatedAt: string;
  policy?: MatchingPolicyReference;
  criteria: EligibilityCriterion[];
  failureReasons?: EligibilityFailureReason[];
  manualReviewReasons?: string[];
  version?: string;
  auditReferenceId?: string;
};

export type MatchingRequest = {
  requestId: string;
  rideRequestId?: string;
  bookingId?: string;
  journeyId?: string;
  serviceType?: VehicleServiceType;
  serviceAreaId?: string;
  schoolId?: string;
  campusId?: string;
  routeId?: string;
  passengerRequirements?: PassengerRequirements;
  timing?: RideTiming;
  pickup?: RideStop;
  destination?: RideStop;
  stops?: RideStop[];
  requestedAt: string;
  requestedByAccountId?: string;
  requestedByOrganizationId?: string;
  childId?: string;
  guardianAccountId?: string;
  paymentMethods?: PaymentMethod[];
  pricingContext?: PricingResult;
  policy?: MatchingPolicyReference;
  idempotency?: MatchingIdempotencyReference;
  concurrency?: MatchingConcurrencyReference;
};

export type MatchingContext = {
  request: MatchingRequest;
  providerId?: string;
  fleetProviderId?: string;
  driverId?: string;
  vehicleId?: string;
  providerType?: ProviderType;
  providerStatus?: ApprovalLifecycleStatus;
  driverApproval?: DriverApprovalStatus;
  vehicleApproval?: VehicleServiceApprovalStatus;
  driverVehicleAssignment?: DriverVehicleAssignment;
  driverAvailability?: DriverAvailability;
  driverAvailabilityWindows?: DriverAvailabilityWindow[];
  serviceAreaIds?: string[];
  availability?: MatchingAvailabilitySnapshot;
  location?: MatchingLocationState;
  capacity?: MatchingCapacitySnapshot;
  feasibility?: MatchingFeasibilityReference;
  scheduleConflictReferences?: MatchingScheduleConflictReference[];
  candidateSnapshot?: MatchingCandidateSnapshot;
  policy?: MatchingPolicyReference;
  idempotency?: MatchingIdempotencyReference;
  concurrency?: MatchingConcurrencyReference;
};

export type CandidateExclusion = {
  reason: EligibilityFailureReason;
  detail?: string;
  criterionCode?: string;
  references?: string[];
};

export type MatchingCandidate = {
  candidateId: string;
  requestId: string;
  driverId?: string;
  vehicleId?: string;
  providerId?: string;
  fleetProviderId?: string;
  eligibility: EligibilityEvaluation;
  exclusions?: CandidateExclusion[];
  candidateSnapshot: MatchingCandidateSnapshot;
  policy?: MatchingPolicyReference;
  idempotency?: MatchingIdempotencyReference;
  concurrency?: MatchingConcurrencyReference;
  manualReviewRequired?: boolean;
  softSignals?: {
    etaMinutes?: number;
    deadheadDistanceMeters?: number;
    reliabilityScore?: number;
    workloadScore?: number;
    routeFitScore?: number;
    fairOpportunityReference?: string;
    recentOfferReferenceIds?: string[];
    acceptanceHistoryReference?: string;
  };
};

export type CandidateGenerationState = 'generated' | 'no_candidates' | 'manual_review';

export type CandidateGenerationResult = {
  requestId: string;
  generatedAt: string;
  state: CandidateGenerationState;
  candidates?: MatchingCandidate[];
  exclusions?: CandidateExclusion[];
  candidateCount: number;
  policy?: MatchingPolicyReference;
  idempotency?: MatchingIdempotencyReference;
  concurrency?: MatchingConcurrencyReference;
  manualReviewReasons?: string[];
  noCandidateReason?: EligibilityFailureReason | 'manual_review_required';
  auditReferenceId?: string;
};

export type RankingSignalType = 'eta' | 'pickup_distance' | 'deadhead_distance' | 'route_fit' | 'schedule_fit' | 'location_freshness' | 'location_confidence' | 'workload' | 'recent_assignments' | 'recent_offers' | 'time_since_last_assignment' | 'provider_reliability' | 'service_reliability' | 'school_transport_continuity' | 'recurring_route_continuity' | 'fair_opportunity' | 'earnings_opportunity' | 'route_uncertainty' | 'road_accessibility' | 'weather_impact' | 'traffic_condition' | 'road_closure' | 'informal_pickup_uncertainty';
export type RankingSignalDirection = 'higher_is_better' | 'lower_is_better' | 'neutral';
export type RankingSignal = { signal: RankingSignalType; direction?: RankingSignalDirection; value?: number; normalizedValue?: number; weight?: number; rationale?: string; evidenceReferences?: string[]; softPreferenceOnly?: boolean; };
export type RankingScoreComponent = { signal: RankingSignalType; rawValue?: number; normalizedValue?: number; weightedValue?: number; weight?: number; rationale?: string; evidenceReferences?: string[]; };
export type RankingPolicy = { policyId?: string; policyVersion?: string; effectiveAt?: string; expiresAt?: string; signalWeights?: Partial<Record<RankingSignalType, number>>; batchStrategy?: 'sequential' | 'small_batch' | 'controlled_wave' | 'priority_candidate' | 'manual_authorized_dispatch'; maxSimultaneousOffers?: number; notes?: string; };
export type CandidateRanking = { rankingId: string; requestId: string; eligibilityGate: EligibilityEvaluation; policy?: RankingPolicy; rankedCandidateIds: string[]; evaluatedAt: string; candidateCount: number; rankingVersion?: string; auditReferenceId?: string; };
export type CandidateRankingResult = { rankingId: string; requestId: string; generatedAt: string; policy?: RankingPolicy; eligibilityGate: EligibilityEvaluation; candidates: Array<{ candidateId: string; eligibility: EligibilityEvaluation; score?: number; position?: number; signals?: RankingSignal[]; scoreComponents?: RankingScoreComponent[]; candidateSnapshot?: MatchingCandidateSnapshot; manualReviewRequired?: boolean; exclusions?: CandidateExclusion[]; }>; rankedCandidateIds: string[]; winnerCandidateId?: string; rankingVersion?: string; auditReferenceId?: string; };
export type DispatchPlanStrategy = 'sequential' | 'small_batch' | 'controlled_wave' | 'priority_candidate' | 'manual_authorized_dispatch';
export type DispatchPlan = { dispatchPlanId: string; bookingId?: string; requestId?: string; rankingId?: string; strategy: DispatchPlanStrategy; policy?: RankingPolicy; generatedAt: string; candidateCount?: number; waveCount?: number; maxSimultaneousOffers?: number; status?: 'draft' | 'ready' | 'in_progress' | 'paused' | 'completed' | 'cancelled'; auditReferenceId?: string; };
export type DispatchWaveStatus = 'planned' | 'open' | 'paused' | 'closed' | 'expired' | 'cancelled' | 'completed';
export type DispatchWave = { dispatchWaveId: string; matchingRequestId: string; bookingId?: string; candidateIds?: string[]; sequenceNumber?: number; createdAt: string; opensAt?: string; expiresAt?: string; policy?: RankingPolicy; maxSimultaneousOffers?: number; previousWaveId?: string; status: DispatchWaveStatus; rankingId?: string; auditReferenceId?: string; };
export type DispatchOfferState = 'created' | 'offered' | 'delivered' | 'viewed' | 'accepted' | 'declined' | 'expired' | 'revoked' | 'superseded' | 'already_taken' | 'stale_request' | 'failed_delivery' | 'unknown';
export type DispatchOffer = { offerId: string; bookingId?: string; matchingRequestId?: string; candidateId?: string; driverId?: string; providerId?: string; vehicleId?: string; dispatchWaveId?: string; createdAt: string; offeredAt?: string; deliveredAt?: string; expiresAt?: string; state: DispatchOfferState; requestVersion?: string; matchingEvaluationId?: string; rankingId?: string; policyVersion?: string; assignmentId?: string; responseId?: string; auditReferenceId?: string; };
export type DispatchOfferResponseValue = 'accepted' | 'declined' | 'expired' | 'revoked' | 'already_taken' | 'superseded' | 'stale_request' | 'failed_delivery' | 'unknown';
export type DispatchOfferResponse = { responseId: string; offerId: string; bookingId?: string; matchingRequestId?: string; candidateId?: string; driverId?: string; providerId?: string; response: DispatchOfferResponseValue; respondedAt: string; receivedAt?: string; clientRespondedAt?: string; sourceDeviceId?: string; connectivityState?: MatchingLocationState['connectivityState']; responseVersion?: string; idempotencyKey?: string; reason?: string; offlineQueued?: boolean; auditReferenceId?: string; };
export type DispatchSelectionState = 'pending' | 'selected' | 'lost' | 'superseded' | 'already_taken' | 'rejected' | 'expired' | 'stale_request';
export type DispatchConcurrencyToken = { tokenId: string; bookingId: string; requestId?: string; dispatchWaveId?: string; offerId?: string; requestVersion?: string; evaluationVersion?: string; revision?: string | number; issuedAt: string; expiresAt?: string; };
export type DispatchDecision = { decisionId: string; bookingId: string; matchingRequestId?: string; selectedOfferId?: string; selectedAssignmentId?: string; responseId?: string; concurrencyToken?: DispatchConcurrencyToken; state: 'pending' | 'selected' | 'lost' | 'already_taken' | 'expired' | 'stale_request' | 'rejected'; decidedAt: string; auditReferenceId?: string; };
export type DispatchOutcome = { outcomeId: string; bookingId: string; matchingRequestId?: string; dispatchWaveId?: string; winningOfferId?: string; winningResponseId?: string; winningAssignmentId?: string; state: 'no_offer' | 'offer_pending' | 'accepted' | 'already_taken' | 'expired' | 'stale_request' | 'rejected' | 'lost_concurrency'; decidedAt: string; auditReferenceId?: string; };
export type RideOffer = { offerId: string; rideRequestId: string; driverId?: string; vehicleId?: string; status: AssignmentStatus; offeredAt: string; expiresAt?: string; metadata?: Record<string, unknown>; };
export type ProviderType = 'individual_driver' | 'parent_driver' | 'fleet_operator' | 'taxi_operator' | 'van_operator' | 'bus_operator' | 'school_owned' | 'contracted_school_provider';
export type Provider = { providerId: string; providerType: ProviderType; organizationId?: string; displayName?: string; serviceAreaIds?: string[]; supportedServiceTypes?: VehicleServiceType[]; vehicleIds?: string[]; driverIds?: string[]; activeStatus?: ApprovalLifecycleStatus; };
export type Payment = { paymentId: string; bookingId?: string; rideRequestId?: string; payerAccountId?: string; providerId?: string; method: PaymentMethod; status: PaymentStatus; amount?: number; currency?: string; };
export type PaymentTransaction = { transactionId: string; paymentId: string; method: PaymentMethod; status: PaymentStatus; externalReference?: string; amount?: number; createdAt?: string; };
export type PlatformFee = { id: string; paymentId?: string; bookingId?: string; amount?: number; currency?: string; status?: PaymentStatus; };
export type ProviderSettlement = { settlementId: string; providerId: string; providerGross?: number; platformFee?: number; providerNet?: number; amountOwedToPoleSafe?: number; cashCollected?: number; officialFare?: number; settlementStatus: SettlementStatus; walletBalance?: number; };
export type CurrencyCode = 'UGX' | 'USD' | 'KES' | 'TZS' | 'RWF' | 'EUR' | 'GBP' | 'other';
export type FinancialAccountOwnerType = 'provider' | 'driver' | 'fleet_provider' | 'school' | 'school_group' | 'parent' | 'household' | 'organization' | 'polesafe_platform' | 'system';
export type FinancialAccountCapability = 'read' | 'post' | 'reconcile' | 'settle' | 'view_sensitive' | 'admin_only';
export type FinancialAccountStatus = 'active' | 'read_only' | 'restricted' | 'frozen' | 'closed';
export type FinancialEntryDirection = 'debit' | 'credit';
export type FinancialEntryStatus = 'pending' | 'posted' | 'held' | 'disputed' | 'reversed' | 'void';
export type FinancialEventType = 'ride_payment' | 'platform_fee' | 'provider_earning' | 'provider_obligation' | 'settlement_offset' | 'refund' | 'adjustment' | 'reversal' | 'subscription_invoice' | 'subscription_payment' | 'reconciliation' | 'transfer' | 'hold' | 'release_hold' | 'dispute' | 'writeoff';
export type FinancialPaymentMethod = PaymentMethod | 'wallet' | 'bank_transfer' | 'manual' | 'internal_journal' | 'mixed';
export type FinancialPaymentStatus = PaymentStatus | 'authorized' | 'captured' | 'partially_refunded' | 'chargeback' | 'partially_settled' | 'pending_review';
export type PaymentFundingSource = 'cash' | 'digital' | 'wallet' | 'invoice' | 'adjustment' | 'reconciliation';
export type FinancialPrivacyLevel = 'public_summary' | 'organization_scoped' | 'provider_scoped' | 'school_scoped' | 'restricted' | 'sensitive';
export type FinancialReconciliationStatus = 'unreconciled' | 'partially_reconciled' | 'reconciled' | 'exception';
export type FinancialHoldReason = 'refund_pending' | 'dispute_pending' | 'risk_review' | 'regulatory_review' | 'operational_hold';
export type LedgerTransactionSourceType = 'payment' | 'ride' | 'subscription' | 'manual' | 'system' | 'reconciliation';
export type LedgerAccountCategory = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' | 'contra_asset' | 'contra_liability' | 'memo';
export type LedgerEntrySide = 'debit' | 'credit';
export type SettlementOffsetDirection = 'debit_provider' | 'credit_provider' | 'apply_to_platform_fee' | 'apply_to_subscription' | 'apply_to_debt';
export type ProviderDebtPolicy = 'recover_from_digital_earnings_first' | 'offset_against_wallet' | 'direct_settlement_due' | 'manual_review_threshold' | 'defer_if_cash_only';
export type EarningsAvailabilityStatus = 'pending' | 'available' | 'held' | 'disputed' | 'reversed' | 'settled';
export type ProviderWalletSettlementState = 'none' | 'owed_to_provider' | 'owed_to_polesafe' | 'net_zero' | 'suspended';
export type SubscriptionCadence = 'free_intro' | 'monthly' | 'quarterly' | 'annual' | 'custom';
export type SubscriptionPlanSizeTier = 'small' | 'standard' | 'large' | 'multi_campus' | 'enterprise' | 'custom';
export type SubscriptionStatus = 'trial' | 'active' | 'grace_period' | 'past_due' | 'suspended' | 'cancelled' | 'expired' | 'read_only';
export type SubscriptionInvoiceStatus = 'draft' | 'issued' | 'due' | 'paid' | 'partial' | 'waived' | 'void' | 'overdue';
export type SubscriptionAcceptanceState = 'pending' | 'accepted' | 'rejected' | 'expired';
export type SubscriptionRenewalReminderPolicy = 'none' | 'gentle' | 'standard' | 'aggressive' | 'custom';
export type FinancialAccount = { accountId: string; ownerType: FinancialAccountOwnerType; ownerId?: string; ownerOrganizationId?: string; ownerAccountId?: string; accountCategory: LedgerAccountCategory; currency: CurrencyCode; status?: FinancialAccountStatus; privacyLevel?: FinancialPrivacyLevel; capabilities?: FinancialAccountCapability[]; isImmutableHistory?: boolean; balanceAsOf?: number; availableBalanceAsOf?: number; heldBalanceAsOf?: number; disputedBalanceAsOf?: number; reversedBalanceAsOf?: number; createdAt?: string; updatedAt?: string; archivedAt?: string; metadata?: Record<string, unknown>; };
export type LedgerTransaction = { transactionId: string; accountId: string; eventType: FinancialEventType; sourceType?: LedgerTransactionSourceType; sourceReferenceId?: string; idempotencyKey?: string; status: FinancialEntryStatus; currency: CurrencyCode; amount: number; effectiveAt: string; createdAt: string; postedAt?: string; reversedByTransactionId?: string; adjustmentOfTransactionId?: string; relatedTransactionIds?: string[]; description?: string; privacyLevel?: FinancialPrivacyLevel; reconciliationStatus?: FinancialReconciliationStatus; metadata?: Record<string, unknown>; };
export type LedgerEntry = { entryId: string; transactionId: string; accountId: string; side: LedgerEntrySide; amount: number; currency: CurrencyCode; status: FinancialEntryStatus; entrySequence?: number; createdAt: string; postedAt?: string; immutable?: true; relatedEntryId?: string; note?: string; metadata?: Record<string, unknown>; };
export type ProviderWallet = { walletId: string; providerId: string; ledgerAccountId: string; currency: CurrencyCode; balance: number; availableBalance?: number; heldBalance?: number; disputedBalance?: number; reversedBalance?: number; amountOwedToPoleSafe?: number; payoutEligibleBalance?: number; settlementState: ProviderWalletSettlementState; lastProjectedAt?: string; sourceLedgerTransactionIds?: string[]; isProjection?: true; privacyLevel?: FinancialPrivacyLevel; };
export type SettlementOffset = { offsetId: string; sourceObligationId: string; targetPositionId?: string; targetEarningId?: string; appliedAmount: number; remainingAmount?: number; currency: CurrencyCode; direction: SettlementOffsetDirection; ledgerTransactionId?: string; ledgerEntryIds?: string[]; createdAt?: string; effectiveAt?: string; status?: FinancialEntryStatus; notes?: string; metadata?: Record<string, unknown>; };
export type ProviderEarning = { earningId: string; providerId: string; driverId?: string; fleetProviderId?: string; bookingId?: string; journeyId?: string; paymentId?: string; pricingResultId?: string; pricingResult?: PricingResult; sourceType: PaymentFundingSource; paymentMethod?: FinancialPaymentMethod; amount: number; currency: CurrencyCode; status: EarningsAvailabilityStatus; availableAt?: string; heldUntil?: string; disputedAt?: string; reversedAt?: string; settledAt?: string; platformFeeAmount?: number; providerGrossAmount?: number; providerNetAmount?: number; poleSafeFeeReceivable?: number; providerObligationToPoleSafe?: number; settlementOffsetAmount?: number; cashCollectedByProvider?: boolean; digitalPaymentReferenceId?: string; ledgerTransactionId?: string; ledgerEntryIds?: string[]; privacyLevel?: FinancialPrivacyLevel; reconciliationStatus?: FinancialReconciliationStatus; metadata?: Record<string, unknown>; };

export type Refund = { refundId: string; paymentId?: string; bookingId?: string; amount: number; currency: CurrencyCode; reason?: string; status?: 'pending' | 'approved' | 'rejected' | 'completed'; ledgerTransactionId?: string; reversalTransactionId?: string; metadata?: Record<string, unknown>; };
export type FinancialAdjustment = { adjustmentId: string; paymentId?: string; bookingId?: string; amount: number; currency: CurrencyCode; reason?: string; status?: 'pending' | 'approved' | 'rejected' | 'completed'; ledgerTransactionId?: string; reversalTransactionId?: string; metadata?: Record<string, unknown>; };
export type RefundAdjustment = Refund | FinancialAdjustment;
export type PaymentRailType = PaymentMethod | 'bank' | 'internal_credit' | 'organization_billing';
export type PaymentEnvironmentMode = 'sandbox' | 'test' | 'production';
export type PaymentStatusFlow = 'initiated' | 'pending' | 'authorized' | 'succeeded' | 'failed' | 'cancelled' | 'reversed' | 'disputed' | 'refunded' | 'partially_refunded' | 'reconciliation_required' | 'unknown_external_state';
export type PaymentProcessingStatus = 'first_seen' | 'processed' | 'duplicate_ignored' | 'conflict' | 'reconciliation_required';
export type PaymentCallbackVerificationStatus = 'unverified' | 'verified' | 'failed' | 'failed_closed';
export type PaymentReconciliationStatus = 'unreconciled' | 'matched' | 'partially_matched' | 'missing_external' | 'missing_internal' | 'amount_mismatch' | 'status_mismatch' | 'duplicate_external' | 'duplicate_internal' | 'unknown' | 'resolved';
export type PaymentMethodContext = 'transport_booking' | 'school_subscription' | 'provider_obligation_repayment' | 'payout_fee' | 'refund' | 'other';
export type PaymentRetryPolicy = { policyId: string; provider?: string; rail?: PaymentRailType; maxAttempts?: number; retryableErrorCategories?: Array<'timeout' | 'network' | 'provider_error' | 'temporary_unavailable' | 'rate_limited' | 'ambiguous'>; backoffReference?: string; providerSpecificPolicyReference?: string; statusInquiryBeforeRetry?: boolean; reuseIdempotencyKey?: boolean; newIdempotencyKeyOnRetry?: boolean; };
export type PaymentProviderConfiguration = { providerConfigId: string; provider: string; market?: string; supportedCurrencies?: CurrencyCode[]; supportedOperations?: Array<'initiatePayment' | 'getPaymentStatus' | 'cancelPayment' | 'refundPayment' | 'verifyCallback' | 'normalizeCallback' | 'reconcileTransaction' | 'getProviderReference'>; callbackVerificationMethod?: Array<'signature' | 'source_validation' | 'timestamp_freshness' | 'replay_protection' | 'provider_event_id'>; statusInquiryCapability?: boolean; refundCapability?: boolean; enabled?: boolean; version?: string; effectiveFrom?: string; effectiveTo?: string; environmentMode?: PaymentEnvironmentMode; notes?: string; };
export type PaymentProviderReference = { providerReferenceId: string; provider: string; paymentId?: string; providerEventId?: string; providerTransactionId?: string; externalReference?: string; idempotencyKey?: string; correlationId?: string; requestId?: string; createdAt?: string; metadata?: Record<string, unknown>; };
export type PaymentIntent = { paymentIntentId: string; paymentId?: string; bookingId?: string; subscriptionId?: string; payerAccountId?: string; amount: number; currency: CurrencyCode; rail: PaymentRailType; provider?: string; externalReference?: string; idempotencyKey: string; initiatedAt: string; expiresAt?: string; status: PaymentStatusFlow; failureReason?: string; providerResponseReference?: string; reconciliationStatus?: PaymentReconciliationStatus; methodContext?: PaymentMethodContext; offlineCreated?: boolean; queuedLocally?: boolean; sentAt?: string; providerAcknowledgedAt?: string; syncedAt?: string; conflictStatus?: 'clean' | 'pending_sync' | 'conflict' | 'resolved'; supportCaseId?: string; auditEventId?: string; notificationEventId?: string; correlationId?: string; providerRequestId?: string; providerTransactionId?: string; ledgerTransactionId?: string; reconciliationRunId?: string; notes?: string; };
export type PaymentAttempt = { paymentAttemptId: string; paymentIntentId: string; paymentId?: string; attemptNumber: number; rail: PaymentRailType; provider?: string; externalReference?: string; idempotencyKey: string; initiatedAt: string; expiresAt?: string; status: PaymentStatusFlow; failureReason?: string; providerResponseReference?: string; providerTransactionId?: string; processingStatus?: PaymentProcessingStatus; duplicateDetected?: boolean; callbackEventId?: string; reconciliationStatus?: PaymentReconciliationStatus; auditEventId?: string; completedAt?: string; notes?: string; };
export type PaymentCallbackEvent = { callbackEventId: string; provider: string; eventId: string; eventType: string; externalTransactionId?: string; paymentId?: string; paymentIntentId?: string; receivedAt: string; providerTimestamp?: string; rawPayloadReference?: string; signatureVerificationStatus: PaymentCallbackVerificationStatus; normalizedStatus?: PaymentStatusFlow; idempotencyKey?: string; processingStatus: PaymentProcessingStatus; duplicateDetected?: boolean; auditEventId?: string; correlationId?: string; providerRequestId?: string; providerTransactionId?: string; reconciliationRunId?: string; notes?: string; };
export type PaymentProviderAdapter = { provider: string; rail: PaymentRailType; environmentMode?: PaymentEnvironmentMode; initiatePayment?: (intent: PaymentIntent) => Promise<PaymentAttempt> | PaymentAttempt; getPaymentStatus?: (reference: PaymentProviderReference) => Promise<PaymentStatusFlow> | PaymentStatusFlow; cancelPayment?: (reference: PaymentProviderReference) => Promise<PaymentStatusFlow> | PaymentStatusFlow; refundPayment?: (reference: PaymentProviderReference) => Promise<PaymentStatusFlow> | PaymentStatusFlow; verifyCallback?: (event: PaymentCallbackEvent) => Promise<PaymentCallbackVerificationStatus> | PaymentCallbackVerificationStatus; normalizeCallback?: (event: PaymentCallbackEvent) => PaymentCallbackEvent; reconcileTransaction?: (reference: PaymentProviderReference) => Promise<PaymentReconciliationStatus> | PaymentReconciliationStatus; getProviderReference?: (reference: PaymentProviderReference) => string | undefined; };
export type PaymentRail = PaymentProviderAdapter;
export type MtnMomoAdapterConfiguration = { provider: 'mtn_momo'; market?: string; currency?: CurrencyCode; msisdnNormalization?: 'e164' | 'uganda_first'; callbackVerificationMethod?: PaymentProviderConfiguration['callbackVerificationMethod']; environmentMode?: PaymentEnvironmentMode; };
export type AirtelMoneyAdapterConfiguration = { provider: 'airtel_money'; market?: string; currency?: CurrencyCode; msisdnNormalization?: 'e164' | 'uganda_first'; callbackVerificationMethod?: PaymentProviderConfiguration['callbackVerificationMethod']; environmentMode?: PaymentEnvironmentMode; };
export type CashPaymentRecord = { cashPaymentRecordId: string; paymentId?: string; bookingId?: string; providerId?: string; collectedByProvider?: boolean; amount?: number; currency?: CurrencyCode; recordedAt?: string; notes?: string; };
export type PostingPolicy = { postingPolicyId: string; paymentMethod?: PaymentRailType; methodContext?: PaymentMethodContext; providerType?: ProviderType; ledgerTransactionType?: FinancialEventType; successPostingIdempotencyKey?: string; };
export type LedgerPostingInstruction = { instructionId: string; paymentId?: string; paymentIntentId?: string; paymentAttemptId?: string; callbackEventId?: string; providerReferenceId?: string; ledgerTransactionId?: string; amount?: number; currency?: CurrencyCode; eventType?: FinancialEventType; idempotencyKey?: string; status?: PaymentStatusFlow; reconciliationStatus?: PaymentReconciliationStatus; notes?: string; };
export type ReconciliationRun = { reconciliationRunId: string; provider?: string; rail?: PaymentRailType; periodStartAt?: string; periodEndAt?: string; expectedTransactionIds?: string[]; observedTransactionIds?: string[]; matchedTransactionIds?: string[]; missingExternalTransactionIds?: string[]; missingInternalTransactionIds?: string[]; amountMismatchTransactionIds?: string[]; statusMismatchTransactionIds?: string[]; duplicateExternalTransactionIds?: string[]; duplicateInternalTransactionIds?: string[]; unknownTransactionIds?: string[]; resolvedTransactionIds?: string[]; auditEventId?: string; status?: PaymentReconciliationStatus; createdAt?: string; completedAt?: string; notes?: string; };
export type ReconciliationRecord = { reconciliationRecordId: string; reconciliationRunId?: string; paymentId?: string; providerReferenceId?: string; externalTransactionId?: string; amount?: number; currency?: CurrencyCode; matchKey?: string; status?: PaymentReconciliationStatus; notes?: string; };
export type RefundAdapter = { provider: string; rail: PaymentRailType; fullRefundSupported?: boolean; partialRefundSupported?: boolean; originalTransactionReference?: string; refundProviderReference?: string; callbackStatus?: PaymentStatusFlow; ledgerReversalReference?: string; environmentMode?: PaymentEnvironmentMode; };
export type PricingConfiguration = { pricingId: string; serviceAreaId?: string; vehicleClass?: VehiclePhysicalClass; capacity?: number; serviceType?: VehicleServiceType; factors?: Array<'distance' | 'time' | 'pickup_distance' | 'scheduled' | 'recurring' | 'waiting' | 'tolls' | 'parking' | 'multiple_stops' | 'cancellation'>; riderFare?: number; providerGross?: number; platformFee?: number; providerNet?: number; };
export type SubscriptionPlan = { planId: string; planSizeTier: SubscriptionPlanSizeTier; planName?: string; cadence: SubscriptionCadence; currency: CurrencyCode; amount?: number; introductoryAmount?: number; introductoryDurationDays?: number; introductoryDurationMonths?: number; launchIntroDurationDays?: number; launchIntroDurationMonths?: number; startsFromSchoolActivation?: boolean; supportsSchoolSizeTiering?: boolean; supportsMultiCampus?: boolean; supportsEnterpriseOwnership?: boolean; supportsGroupOwnership?: boolean; explicitPaidAcceptanceRequired?: boolean; freeIntroAllowed?: boolean; gracePeriodDays?: number; readOnlyOnExpiry?: boolean; renewalReminderPolicy?: SubscriptionRenewalReminderPolicy; renewalReminderLeadDays?: number[]; priceVersion?: string; effectiveFrom?: string; effectiveUntil?: string; notes?: string; };
export type SchoolSubscription = { subscriptionId: string; schoolId?: string; schoolGroupId?: string; campusId?: string; ownerOrganizationId?: string; ownerAccountId?: string; planId: string; status: SubscriptionStatus; currency: CurrencyCode; introAmount?: number; paidAmount?: number; currentTermStartAt?: string; currentTermEndAt?: string; activatedAt?: string; introStartsAt?: string; introEndsAt?: string; launchedAt?: string; gracePeriodEndsAt?: string; readOnlyAt?: string; explicitlyAcceptedPaidTerms?: boolean; paidTermsAcceptedAt?: string; paidTermsAcceptedByAccountId?: string; invoiceId?: string; invoiceStatus?: SubscriptionInvoiceStatus; paymentStatus?: FinancialPaymentStatus; paymentMethod?: FinancialPaymentMethod; ledgerTransactionId?: string; renewalReminderPolicy?: SubscriptionRenewalReminderPolicy; renewalReminderSentAt?: string[]; subscriptionPeriodMonths?: number; autoRenewEnabled?: boolean; dataRetentionReferenceId?: string; entitlementScope?: 'dashboard_only' | 'dashboard_and_reporting' | 'dashboard_and_admin'; schoolSubscriptionPurpose?: 'launch_free' | 'intro_free' | 'paid_monthly' | 'paid_custom'; parentAccountsUnaffectedByStatus?: boolean; transportFeesSeparate?: true; privacyLevel?: FinancialPrivacyLevel; metadata?: Record<string, unknown>; };
export type SubscriptionInvoice = { invoiceId: string; subscriptionId: string; schoolId?: string; schoolGroupId?: string; currency: CurrencyCode; amountDue: number; amountPaid?: number; status: SubscriptionInvoiceStatus; issuedAt?: string; dueAt?: string; periodStartAt?: string; periodEndAt?: string; termsAccepted?: boolean; ledgerTransactionId?: string; privacyLevel?: FinancialPrivacyLevel; metadata?: Record<string, unknown>; };
export type FarePolicy = {
  pricingPolicyId: string;
  policyName?: string;
  market?: string;
  serviceAreaId?: string;
  currency?: string;
  serviceType?: VehicleServiceType;
  vehicleClass?: VehiclePhysicalClass;
  providerType?: ProviderType;
  passengerCapacity?: number;
  tripDistance?: number;
  estimatedTripTime?: number;
  pickupDistance?: number;
  expectedTraffic?: 'low' | 'moderate' | 'high' | 'extreme';
  operatingCostReference?: number;
  fuelIndexReference?: string;
  marketBenchmarkReference?: string;
  waitingTime?: number;
  multipleStops?: boolean;
  scheduledRide?: boolean;
  recurringRide?: boolean;
  serviceContext?: 'school' | 'community' | 'personal' | 'fleet_contract';
  tolls?: number;
  parking?: number;
  pricingVersion?: string;
  effectiveFrom?: string;
  effectiveUntil?: string;
  createdAt?: string;
  updatedAt?: string;
  notes?: string;
};

export type PricingPolicy = FarePolicy & {
  businessRule?: 'fair_rider_fare_plus_worthwhile_driver_provider_earnings_plus_sustainable_polesafe_revenue';
  riderAffordabilityPriority?: boolean;
  providerEarningsPriority?: boolean;
  sustainabilityPriority?: boolean;
};

export type PricingResult = {
  riderFare?: number;
  providerGross?: number;
  platformFee?: number;
  providerNet?: number;
  currency?: string;
  pricingPolicyId?: string;
  pricingVersion?: string;
  calculatedAt?: string;
  validUntil?: string;
  fuelIndexReference?: string;
  marketBenchmarkReference?: string;
  adjustmentReason?: string;
  manualOverrideReference?: string;
  riderBreakdown?: {
    fare?: number;
    surcharges?: number;
    discount?: number;
    total?: number;
  };
  providerBreakdown?: {
    riderFare?: number;
    poleSafeFee?: number;
    gross?: number;
    net?: number;
  };
  transparencyVersion?: string;
};

export type FuelType = 'petrol' | 'diesel' | 'hybrid' | 'electric' | 'energy_proxy';

export type FuelMarketIndex = {
  fuelIndexId: string;
  country?: string;
  market?: string;
  serviceAreaId?: string;
  region?: string;
  fuelType: FuelType;
  observedPricePerLitre?: number;
  sourceReference?: string;
  observedAt?: string;
  effectiveAt?: string;
  rollingAverage?: number;
  confidence?: number;
  status?: 'draft' | 'observed' | 'verified' | 'suspended' | 'expired';
  version?: string;
};

export type FuelAdjustmentPolicy = {
  policyId: string;
  baselineFuelIndex?: string;
  currentFuelIndex?: string;
  changeThreshold?: number;
  smoothingWindow?: number;
  maxAdjustmentPerPeriod?: number;
  upwardAdjustmentAllowed?: boolean;
  downwardAdjustmentAllowed?: boolean;
  effectiveAt?: string;
  serviceAreaId?: string;
  manualApprovalThreshold?: number;
  emergencyFreeze?: boolean;
};

export type MarketBenchmark = {
  benchmarkId: string;
  market?: string;
  serviceAreaId?: string;
  vehicleCategory?: VehiclePhysicalClass | RideVehicleKind | ProviderType;
  observationWindow?: string;
  minimumObservedFare?: number;
  medianObservedFare?: number;
  maximumObservedFare?: number;
  sampleConfidence?: number;
  sourceReference?: string;
  observedAt?: string;
  version?: string;
};

export type FairFareCorridor = {
  corridorId: string;
  minimumSustainableFare?: number;
  targetFare?: number;
  maximumAcceptableFare?: number;
  minimumProviderNet?: number;
  riderAffordabilityGuardrail?: number;
  marketCompetitivenessGuardrail?: number;
  platformSustainabilityGuardrail?: number;
};

export type ProviderEarningsGuardrail = {
  guardrailId: string;
  providerType?: ProviderType;
  vehicleClass?: VehiclePhysicalClass;
  serviceType?: VehicleServiceType;
  estimatedFuelCostReference?: number;
  pickupDeadheadCostReference?: number;
  estimatedOperatingCost?: number;
  minimumProviderNet?: number;
  minimumEarningsPerDistance?: number;
  minimumEarningsPerTime?: number;
};

export type PickupDeadheadEconomics = {
  pickupDistance?: number;
  pickupEstimatedTime?: number;
  pickupOperatingCost?: number;
  deadheadAllowanceReference?: number;
  maxReasonablePickupDistance?: number;
};

export type PlatformFeePolicy = {
  policyId: string;
  market?: string;
  serviceType?: VehicleServiceType;
  providerType?: ProviderType;
  vehicleClass?: VehiclePhysicalClass;
  feeMethod?: 'percentage' | 'flat' | 'hybrid' | 'tiered' | 'provider_specific' | 'fleet_contract' | 'negotiated_large_transport';
  effectiveDate?: string;
  pricingVersion?: string;
};

export type PromotionPolicy = {
  promotionId: string;
  baseFare?: number;
  discount?: number;
  riderTotal?: number;
  subsidyFundingSource?: string;
  providerEarningsProtected?: boolean;
};

export type SurgeGuardrail = {
  guardrailId: string;
  maximumMultiplier?: number;
  cap?: number;
  reason?: string;
  serviceAreaId?: string;
  timeWindow?: string;
  schoolExceptionPolicy?: string;
  emergencyExceptionPolicy?: string;
};

export type MarketPricingAdjustmentPolicy = {
  policyId: string;
  scheduledReviewFrequency?: string;
  fuelTriggeredAdjustment?: boolean;
  marketTriggeredAdjustment?: boolean;
  costTriggeredAdjustment?: boolean;
  maxPercentageChangePerCycle?: number;
  minimumChangeThreshold?: number;
  manualApprovalThreshold?: number;
  emergencyFreeze?: boolean;
  rollbackPriorVersionReference?: string;
};

export type CancellationEvent = { cancellationId: string; bookingId?: string; assignmentId?: string; journeyId?: string; status: CancellationStatus; reason?: string; actorAccountId?: string; noShowType?: 'passenger' | 'driver' | 'provider' | 'school'; source?: 'booking' | 'assignment' | 'journey'; };
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
export type SessionClaim = { accountId: string; approvedCapabilities: CapabilityEntitlement[]; approvedExperiences: ApprovedExperience[]; activeExperience?: ActiveExperience; organizationScopes?: OrganizationMembership[]; sessionVersion: number; scope?: SessionScope; role?: PoleSafeRole; };
export type RoutePolicyKey = '/parent' | '/driver' | '/school' | '/ops' | '/dispatch' | '/compliance';
export type RoutePolicy = { path: RoutePolicyKey; requiredCapabilities?: CapabilityEntitlement['capability'][]; requiredExperiences?: ApprovedExperienceType[]; requiredRoles?: PoleSafeRole[]; requiredOrganizationTypes?: OrganizationType[]; requireApprovedDriver?: boolean; allowDemoFallback?: boolean; };
export const ROUTE_POLICY_MAP: Record<RoutePolicyKey, RoutePolicy> = { '/parent': { path: '/parent', requiredCapabilities: ['ride', 'book_for_self', 'book_for_child', 'manage_household'], requiredExperiences: ['personal_rides', 'my_family'], requiredRoles: ['rider', 'parent'], allowDemoFallback: true }, '/driver': { path: '/driver', requiredCapabilities: ['drive'], requiredExperiences: ['drive'], requiredRoles: ['driver'], requireApprovedDriver: true, allowDemoFallback: true }, '/school': { path: '/school', requiredCapabilities: ['manage_school_transport', 'verify_school_handoff'], requiredExperiences: ['school'], requiredRoles: ['school_staff', 'admin_ops'], requiredOrganizationTypes: ['school'], allowDemoFallback: true }, '/ops': { path: '/ops', requiredCapabilities: ['manage_ops'], requiredExperiences: ['admin_ops'], requiredRoles: ['admin_ops', 'system'], requiredOrganizationTypes: ['polesafe_internal'], allowDemoFallback: true }, '/dispatch': { path: '/dispatch', requiredCapabilities: ['manage_ops', 'manage_community_transport'], requiredExperiences: ['community'], requiredRoles: ['admin_ops', 'community_staff', 'system'], requiredOrganizationTypes: ['community', 'fleet_provider', 'polesafe_internal'], allowDemoFallback: true }, '/compliance': { path: '/compliance', requiredCapabilities: ['manage_ops'], requiredExperiences: ['admin_ops'], requiredRoles: ['admin_ops', 'system'], requiredOrganizationTypes: ['polesafe_internal', 'community', 'school'], allowDemoFallback: true }, };
export function getRoutePolicy(path: RoutePolicyKey): RoutePolicy { return ROUTE_POLICY_MAP[path]; }
