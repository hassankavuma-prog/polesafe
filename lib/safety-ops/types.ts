import type { z } from 'zod';
import { createSosInputSchema, dispatcherDashboardResponseSchema, geoPointSchema, incidentActionInputSchema, incidentAuditEntrySchema, incidentContactRelaySchema, incidentDeviceStatusSchema, incidentSeveritySchema, incidentStatusSchema, incidentTriggerTypeSchema, maskIncidentInputSchema, resolveIncidentInputSchema, safetyIncidentSchema } from './schemas';

export type IncidentTriggerType = z.infer<typeof incidentTriggerTypeSchema>;
export type IncidentSeverity = z.infer<typeof incidentSeveritySchema>;
export type IncidentStatus = z.infer<typeof incidentStatusSchema>;
export type GeoPoint = z.infer<typeof geoPointSchema>;
export type IncidentDeviceStatus = z.infer<typeof incidentDeviceStatusSchema>;
export type IncidentAuditEntry = z.infer<typeof incidentAuditEntrySchema>;
export type IncidentContactRelay = z.infer<typeof incidentContactRelaySchema>;
export type SafetyIncident = z.infer<typeof safetyIncidentSchema>;
export type CreateSosInput = z.infer<typeof createSosInputSchema>;
export type IncidentActionInput = z.infer<typeof incidentActionInputSchema>;
export type ResolveIncidentInput = z.infer<typeof resolveIncidentInputSchema>;
export type MaskIncidentInput = z.infer<typeof maskIncidentInputSchema>;
export type DispatcherDashboardResponse = z.infer<typeof dispatcherDashboardResponseSchema>;
