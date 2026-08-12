import { z } from 'zod';

export const incidentTriggerTypeSchema = z.enum(['manual_sos', 'silent_alarm', 'fall_detection', 'driver_report', 'school_report', 'system_flag']);
export const incidentSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);
export const incidentStatusSchema = z.enum(['active', 'triaged', 'escalated', 'resolved', 'false_alarm', 'dismissed']);
export const contactRelayTypeSchema = z.enum(['parent', 'driver', 'school', 'dispatcher', 'police', 'medical']);
export const contactRelayStatusSchema = z.enum(['pending', 'sent', 'acknowledged', 'failed']);
export const networkStateSchema = z.enum(['online', 'poor', 'offline', 'unknown']);

export const geoPointSchema = z.object({ type: z.literal('Point'), coordinates: z.tuple([z.number(), z.number()]) });

export const incidentDeviceStatusSchema = z.object({
  batteryPercent: z.number().min(0).max(100).optional(),
  networkState: networkStateSchema.optional().default('unknown'),
  lastSeenAt: z.coerce.date().optional(),
}).strict();

export const incidentAuditEntrySchema = z.object({
  action: z.string().min(1),
  actorId: z.string().optional(),
  actorRole: z.string().optional(),
  note: z.string().optional(),
  timestamp: z.coerce.date(),
}).strict();

export const incidentContactRelaySchema = z.object({
  contactType: contactRelayTypeSchema,
  contactId: z.string().optional(),
  status: contactRelayStatusSchema.optional().default('pending'),
  sentAt: z.coerce.date().optional(),
  acknowledgedAt: z.coerce.date().optional(),
}).strict();

export const safetyIncidentSchema = z.object({
  _id: z.string(),
  incidentNumber: z.string().min(1),
  triggerType: incidentTriggerTypeSchema,
  severity: incidentSeveritySchema,
  status: incidentStatusSchema,
  reporterUserId: z.string().optional(),
  reporterRole: z.enum(['parent', 'driver', 'school_admin', 'polesafe_admin', 'system']).optional(),
  childId: z.string().optional(),
  rideId: z.string().optional(),
  schoolId: z.string().optional(),
  liveLocation: geoPointSchema.nullable().optional(),
  locationLabel: z.string().nullable().optional(),
  deviceStatus: incidentDeviceStatusSchema.optional(),
  contactRelay: z.array(incidentContactRelaySchema).optional(),
  assignedOperatorId: z.string().optional(),
  resolvedById: z.string().optional(),
  resolutionNote: z.string().optional(),
  falseAlarmReason: z.string().optional(),
  privacyMasked: z.boolean(),
  verified: z.boolean(),
  verifiedAt: z.coerce.date().optional(),
  auditTrail: z.array(incidentAuditEntrySchema),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
}).strict();

export const createSosInputSchema = z.object({
  userId: z.string().min(1),
  userRole: z.enum(['parent', 'driver', 'school_admin', 'polesafe_admin', 'system']),
  kidId: z.string().optional(),
  rideId: z.string().optional(),
  location: z.object({
    coordinates: z.tuple([z.number(), z.number()]).optional(),
    label: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
  message: z.string().optional(),
  triggerType: incidentTriggerTypeSchema.optional(),
  severity: incidentSeveritySchema.optional(),
  deviceStatus: incidentDeviceStatusSchema.optional(),
}).strict();

export const incidentActionInputSchema = z.object({
  incidentId: z.string().min(1),
  userId: z.string().min(1),
  userRole: z.enum(['parent', 'driver', 'school_admin', 'polesafe_admin', 'system']),
  note: z.string().optional(),
}).strict();

export const resolveIncidentInputSchema = incidentActionInputSchema.extend({
  resolutionNote: z.string().optional(),
  falseAlarmReason: z.string().optional(),
});

export const maskIncidentInputSchema = incidentActionInputSchema;

export const dispatcherDashboardStatsSchema = z.object({
  active: z.number().int().nonnegative(),
  triaged: z.number().int().nonnegative(),
  resolved: z.number().int().nonnegative(),
}).strict();

export const dispatcherDashboardResponseSchema = z.object({
  stats: dispatcherDashboardStatsSchema,
  incidents: z.array(safetyIncidentSchema),
  privacyMode: z.literal('masked'),
  allowedActions: z.array(z.enum(['acknowledge', 'assign', 'escalate', 'resolve', 'mark_false_alarm', 'unmask'])),
}).strict();

export const unmaskIncidentInputSchema = incidentActionInputSchema.extend({
  verified: z.boolean().default(false),
});
