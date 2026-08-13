import type { z } from 'zod';
import type {
  contactRelayStatusSchema,
  dispatcherRoleSchema,
  incidentSeveritySchema,
  incidentStatusSchema,
  incidentTriggerTypeSchema,
  networkStateSchema,
  geoPointSchema,
} from '../lib/safety-ops/schemas';

export type UserRole = 'parent' | 'driver' | 'school_admin' | 'polesafe_admin' | 'system';

export type OrganizationKind = 'platform' | 'district' | 'school_group' | 'school';

export type OperationalConfidence =
  | 'confirmed'
  | 'inferred'
  | 'delayed'
  | 'offline-received'
  | 'manually-verified';

export interface ConfidenceStamped {
  confidence: OperationalConfidence;
  confidenceNote?: string;
  confidenceSource?: string;
  confidenceUpdatedAt?: string;
}

export interface Organization {
  id: string;
  name: string;
  country: string;
  currency: string;
  parentOrganizationId?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface School extends Organization {
  kind: 'school';
  campuses: SchoolCampus[];
}

export interface SchoolCampus {
  id: string;
  organizationId: string;
  name: string;
  address: string;
  region: string;
  contactPhone: string;
  isPrimary?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ComplianceStatus = 'pending' | 'verified' | 'rejected' | 'expired';

export interface ComplianceDocument {
  id: string;
  type:
    | 'national_id'
    | 'drivers_license'
    | 'police_clearance'
    | 'vehicle_inspection'
    | 'passport_photo'
    | 'training_certificate';
  url: string;
  status: ComplianceStatus;
  issuedAt?: string;
  expiresAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface DriverComplianceVault {
  driverId: string;
  nationalIdNumber: string;
  nationalIdDocumentUrl?: string;
  driversLicenseUrl?: string;
  policeCheckCertificateUrl?: string;
  vehicleInspectionUrl?: string;
  status: ComplianceStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  documents?: ComplianceDocument[];
}

export interface SmsUssdFallbackPayload extends ConfidenceStamped {
  messageId: string;
  senderPhone: string;
  gatewayProvider: 'africas_talking' | 'twilio' | 'custom_ussd';
  rawText: string;
  interpretedAction: 'SOS' | 'CHECKIN' | 'PICKUP_CONFIRM' | 'UNKNOWN';
  associatedChildId?: string;
  processedAt: string;
  success: boolean;
  schoolId?: string;
  campusId?: string;
}

export interface UssdSessionPayload extends ConfidenceStamped {
  sessionId: string;
  senderPhone: string;
  serviceCode: string;
  rawText: string;
  interpretedAction: 'OPEN_MENU' | 'REPORT_INCIDENT' | 'CONFIRM_PICKUP' | 'CONFIRM_DROPOFF' | 'UNKNOWN';
  step?: string;
  processedAt: string;
  success: boolean;
}

export interface TransportLedgerTransaction extends ConfidenceStamped {
  transactionId: string;
  organizationId: string;
  parentId: string;
  amountUgx: number;
  paymentMethod: 'flutterwave_momo' | 'airtel_money' | 'cash_credit';
  status: 'success' | 'pending' | 'failed';
  termReference: string;
  createdAt: string;
  paymentMatchStatus?: 'matched' | 'pending' | 'reconciled' | 'failed';
  paymentProvider?: 'mtn_momo' | 'airtel_money' | 'unknown';
}

export type SafetyIncident = {
  _id: string;
  incidentNumber: string;
  triggerType: z.infer<typeof incidentTriggerTypeSchema>;
  severity: z.infer<typeof incidentSeveritySchema>;
  status: z.infer<typeof incidentStatusSchema>;
  reporterUserId?: string;
  reporterRole?: z.infer<typeof dispatcherRoleSchema>;
  childId?: string;
  rideId?: string;
  schoolId?: string;
  liveLocation?: z.infer<typeof geoPointSchema> | null;
  locationLabel?: string | null;
  deviceStatus?: {
    batteryPercent?: number;
    networkState?: z.infer<typeof networkStateSchema>;
    lastSeenAt?: Date;
  };
  contactRelay?: Array<{
    contactType: 'parent' | 'driver' | 'school' | 'dispatcher' | 'police' | 'medical';
    contactId?: string;
    status?: z.infer<typeof contactRelayStatusSchema>;
    sentAt?: Date;
    acknowledgedAt?: Date;
  }>;
  assignedOperatorId?: string;
  resolvedById?: string;
  resolutionNote?: string;
  falseAlarmReason?: string;
  privacyMasked: boolean;
  verified: boolean;
  verifiedAt?: Date;
  auditTrail: Array<{
    action: string;
    actorId?: string;
    actorRole?: string;
    note?: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
};

export interface SafetyOpsTenantContext {
  organizationId: string;
  schoolId?: string;
  campusId?: string;
  role: UserRole;
  dispatcherRole?: z.infer<typeof dispatcherRoleSchema>;
}

export interface OperationalEvent extends ConfidenceStamped {
  eventId: string;
  eventType:
    | 'child_checkin'
    | 'child_checkout'
    | 'ride_update'
    | 'vehicle_telemetry'
    | 'payment'
    | 'sos'
    | 'school_gate'
    | 'sms_log';
  actorRole?: UserRole | 'dispatcher' | 'school_admin' | 'student';
  actorId?: string;
  organizationId?: string;
  schoolId?: string;
  campusId?: string;
  childId?: string;
  rideId?: string;
  vehicleId?: string;
  incidentId?: string;
  transactionId?: string;
  messageId?: string;
  occurredAt: string;
  summary: string;
  sourceChannel?: 'app' | 'sms' | 'ussd' | 'telemetry' | 'payment_gateway' | 'manual';
  privacyMasked?: boolean;
  metadata?: Record<string, unknown>;
}
