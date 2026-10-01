/**
 * audit-log.schema.ts — Zod schema for the optional audit log payload.
 *
 * This boilerplate intentionally keeps the schema generic. Concrete audit
 * writers/consumers can extend `EventType` / `SERVICE_NAMES` as needed
 * without dragging in queue-specific infrastructure.
 */
import { z } from "zod";

export enum EventType {
  create = "create",
  update = "update",
  delete = "delete",
  read = "read",
  login = "login",
  logout = "logout",
  password_change = "password_change",
  permission_change = "permission_change",
}

export const SERVICE_NAMES = [
  "AUTH",
  "USER",
  "ADMIN",
  "PAYMENT",
  "NOTIFICATION",
] as const;

export type ServiceName = (typeof SERVICE_NAMES)[number];

const ChangedFieldValueSchema = z.object({
  from: z.any().optional(),
  to: z.any().optional(),
});

export const ChangedFieldsSchema = z.record(
  z.string(),
  ChangedFieldValueSchema,
);

export const MetadataSchema = z.object({
  user: z
    .object({
      userId: z.string().optional(),
      email: z.string().optional(),
      role: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
  actor: z
    .object({
      userId: z.string(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      role: z.string(),
    })
    .optional(),
  payload: z.record(z.string(), z.any()).optional(),
});

export const FlexibleActorIdSchema = z.union([
  z.string().uuid(),
  z.string().regex(/^[a-f0-9]{24}$/i, "Invalid ObjectId"),
  z.string().regex(/^\d+$/, "Invalid numeric ID format"),
  z.number().int().positive(),
]);

export const AuditLogSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.nativeEnum(EventType),
  serviceName: z.enum(SERVICE_NAMES),
  occurredAt: z.string().datetime({ offset: true }),
  entity: z.string().optional(),
  entityId: z.string().optional(),
  entityTitle: z.string().optional(),
  action: z.string().min(1, "action is required"),
  result: z.enum(["SUCCESS", "FAILURE"]).optional(),
  errorMessage: z.string().optional(),
  actorId: FlexibleActorIdSchema.optional(),
  actorType: z.string().optional(),
  actorEmail: z.string().email().optional(),
  oldData: z.any().optional(),
  newData: z.any().optional(),
  changedFields: ChangedFieldsSchema.optional(),
  metadata: MetadataSchema.optional(),
  requestId: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;