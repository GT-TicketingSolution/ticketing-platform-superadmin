import { desc, eq } from "drizzle-orm";

import { db } from "@/server/db";

import { auditLogs } from "@/server/db/schema";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type CreateAuditLogInput = {
  actorId: string;

  action:
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "APPROVE"
    | "REJECT"
    | "LOGIN"
    | "LOGOUT"
    | "PASSWORD_RESET"
    | "STATUS_CHANGE"
    | "NOTIFICATION_SENT";

  resourceType: string;

  resourceId?: string | null;

  oldValues?: unknown;

  newValues?: unknown;

  ipAddress?: string | null;

  userAgent?: string | null;
};

/* -------------------------------------------------------------------------- */
/* Create Audit Log                                                           */
/* -------------------------------------------------------------------------- */

export async function createAuditLog(data: CreateAuditLogInput) {
  const result = await db
    .insert(auditLogs)
    .values({
      actorId: data.actorId,

      action: data.action,

      resourceType: data.resourceType,

      resourceId: data.resourceId ?? null,

      oldValues: data.oldValues ?? null,

      newValues: data.newValues ?? null,

      ipAddress: data.ipAddress ?? null,

      userAgent: data.userAgent ?? null,
    })
    .returning();

  return result[0] ?? null;
}

/* -------------------------------------------------------------------------- */
/* Get All Audit Logs                                                         */
/* -------------------------------------------------------------------------- */

export async function getAuditLogs() {
  return await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
}

/* -------------------------------------------------------------------------- */
/* Get Audit Log By ID                                                        */
/* -------------------------------------------------------------------------- */

export async function getAuditLogById(id: string) {
  const result = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.id, id))
    .limit(1);

  return result[0] ?? null;
}
