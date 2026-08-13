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

export interface SmsUssdFallbackPayload {
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

export interface UssdSessionPayload {
  sessionId: string;
  senderPhone: string;
  serviceCode: string;
  rawText: string;
  interpretedAction: 'OPEN_MENU' | 'REPORT_INCIDENT' | 'CONFIRM_PICKUP' | 'CONFIRM_DROPOFF' | 'UNKNOWN';
  step?: string;
  processedAt: string;
  success: boolean;
}

export interface TransportLedgerTransaction {
  transactionId: string;
  organizationId: string;
  parentId: string;
  amountUgx: number;
  paymentMethod: 'flutterwave_momo' | 'airtel_money' | 'cash_credit';
  status: 'success' | 'pending' | 'failed';
  termReference: string;
  createdAt: string;
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
