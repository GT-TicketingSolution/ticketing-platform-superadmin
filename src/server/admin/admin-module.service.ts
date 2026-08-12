import { and, asc, eq } from "drizzle-orm";

import { db } from "@/server/db";

import { admins, modules, adminModuleAccess } from "@/server/db/schema";

import { createAuditLog } from "@/server/audit/audit.service";

/* -------------------------------------------------------------------------- */
/* Get Admin Modules                                                          */
/* -------------------------------------------------------------------------- */

export async function getAdminModules(adminId: string) {
  return await db
    .select({
      accessId: adminModuleAccess.id,
      moduleId: modules.id,
      key: modules.key,
      name: modules.name,
      description: modules.description,
      isActive: modules.isActive,
      sortOrder: modules.sortOrder,
      grantedAt: adminModuleAccess.createdAt,
    })
    .from(adminModuleAccess)
    .innerJoin(modules, eq(adminModuleAccess.moduleId, modules.id))
    .where(eq(adminModuleAccess.adminId, adminId))
    .orderBy(asc(modules.sortOrder));
}

/* -------------------------------------------------------------------------- */
/* Get All Active Modules                                                     */
/* -------------------------------------------------------------------------- */

export async function getModules() {
  return await db
    .select()
    .from(modules)
    .where(eq(modules.isActive, true))
    .orderBy(asc(modules.sortOrder));
}

/* -------------------------------------------------------------------------- */
/* Check Admin Exists                                                         */
/* -------------------------------------------------------------------------- */

export async function adminExists(adminId: string) {
  const result = await db
    .select({
      id: admins.id,
    })
    .from(admins)
    .where(eq(admins.id, adminId))
    .limit(1);

  return Boolean(result[0]);
}

/* -------------------------------------------------------------------------- */
/* Check Module Exists                                                        */
/* -------------------------------------------------------------------------- */

export async function moduleExists(moduleId: string) {
  const result = await db
    .select({
      id: modules.id,
      isActive: modules.isActive,
    })
    .from(modules)
    .where(eq(modules.id, moduleId))
    .limit(1);

  return result[0] ?? null;
}

/* -------------------------------------------------------------------------- */
/* Grant Module Access                                                        */
/* -------------------------------------------------------------------------- */

export async function grantModuleAccess(
  adminId: string,
  moduleId: string,
  actorId: string,
) {
  const result = await db
    .insert(adminModuleAccess)
    .values({
      adminId,
      moduleId,
    })
    .returning();

  const access = result[0];

  if (!access) {
    return null;
  }

  /* ---------------------------------------------------------------------- */
  /* Get Admin + Module Details                                             */
  /* ---------------------------------------------------------------------- */

  const [adminResult, moduleResult] = await Promise.all([
    db
      .select({
        id: admins.id,
        fullName: admins.fullName,
      })
      .from(admins)
      .where(eq(admins.id, adminId))
      .limit(1),

    db
      .select({
        id: modules.id,
        key: modules.key,
        name: modules.name,
      })
      .from(modules)
      .where(eq(modules.id, moduleId))
      .limit(1),
  ]);

  const admin = adminResult[0];
  const module = moduleResult[0];

  /* ---------------------------------------------------------------------- */
  /* Audit Log                                                               */
  /* ---------------------------------------------------------------------- */

  await createAuditLog({
    actorId,

    action: "CREATE",

    resourceType: "ADMIN_MODULE_ACCESS",

    resourceId: access.id,

    oldValues: null,

    newValues: {
      ...access,

      adminName: admin?.fullName ?? null,

      moduleName: module?.name ?? null,

      moduleKey: module?.key ?? null,
    },
  });

  return access;
}

/* -------------------------------------------------------------------------- */
/* Revoke Module Access                                                       */
/* -------------------------------------------------------------------------- */

export async function revokeModuleAccess(
  adminId: string,
  moduleId: string,
  actorId: string,
) {
  /* ---------------------------------------------------------------------- */
  /* Get Existing Access                                                    */
  /* ---------------------------------------------------------------------- */

  const existing = await db
    .select()
    .from(adminModuleAccess)
    .where(
      and(
        eq(adminModuleAccess.adminId, adminId),
        eq(adminModuleAccess.moduleId, moduleId),
      ),
    )
    .limit(1);

  const access = existing[0];

  if (!access) {
    return null;
  }

  /* ---------------------------------------------------------------------- */
  /* Get Admin + Module Details                                             */
  /* ---------------------------------------------------------------------- */

  const [adminResult, moduleResult] = await Promise.all([
    db
      .select({
        id: admins.id,
        fullName: admins.fullName,
      })
      .from(admins)
      .where(eq(admins.id, adminId))
      .limit(1),

    db
      .select({
        id: modules.id,
        key: modules.key,
        name: modules.name,
      })
      .from(modules)
      .where(eq(modules.id, moduleId))
      .limit(1),
  ]);

  const admin = adminResult[0];
  const module = moduleResult[0];

  /* ---------------------------------------------------------------------- */
  /* Delete Access                                                           */
  /* ---------------------------------------------------------------------- */

  const result = await db
    .delete(adminModuleAccess)
    .where(
      and(
        eq(adminModuleAccess.adminId, adminId),
        eq(adminModuleAccess.moduleId, moduleId),
      ),
    )
    .returning();

  const deletedAccess = result[0];

  if (!deletedAccess) {
    return null;
  }

  /* ---------------------------------------------------------------------- */
  /* Audit Log                                                               */
  /* ---------------------------------------------------------------------- */

  await createAuditLog({
    actorId,

    action: "DELETE",

    resourceType: "ADMIN_MODULE_ACCESS",

    resourceId: deletedAccess.id,

    oldValues: {
      ...access,

      adminName: admin?.fullName ?? null,

      moduleName: module?.name ?? null,

      moduleKey: module?.key ?? null,
    },

    newValues: null,
  });

  return deletedAccess;
}
