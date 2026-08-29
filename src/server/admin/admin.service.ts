import { and, count, desc, eq, gte, ilike, lte, or } from "drizzle-orm";

import { db } from "@/server/db";
import {
  admins,
  renewals,
  adminModuleAccess,
  modules,
} from "@/server/db/schema";
import { createAuditLog } from "@/server/audit/audit.service";
import { createRenewal } from "@/server/renewal/renewal.service";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type CreateAdminInput = {
  fullName: string;
  businessName: string;
  phone: string;
  city: string;
  email: string;
  subdomain?: string;
  renewalAmount: number;
  joinedAt?: Date;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  moduleIds?: string[];
};

export type UpdateAdminInput = {
  fullName?: string;
  businessName?: string;
  phone?: string;
  city?: string;
  email?: string;
  subdomain?: string | null;
  renewalAmount?: number;
  joinedAt?: Date;
  nextRenewalDate?: Date;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  moduleIds?: string[];
};

export type GetAdminsInput = {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  joinedDate?: Date;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function calculateNextRenewalDate(joinedAt: Date | null) {
  if (!joinedAt) {
    return null;
  }

  const nextRenewalDate = new Date(joinedAt);

  nextRenewalDate.setFullYear(nextRenewalDate.getFullYear() + 1);

  return nextRenewalDate;
}

/* -------------------------------------------------------------------------- */
/* Get All Admins - Search / Filter / Pagination                              */
/* -------------------------------------------------------------------------- */

export async function getAdmins({
  page = 1,
  limit,
  search,
  city,
  joinedDate,
  status,
}: GetAdminsInput = {}) {
  /* ------------------------------------------------------------------------ */
  /* Normalize Pagination                                                     */
  /* ------------------------------------------------------------------------ */

  const currentPage = Math.max(1, Number(page) || 1);

  const pageLimit =
    limit !== undefined && Number(limit) > 0 ? Number(limit) : undefined;

  const offset = pageLimit ? (currentPage - 1) * pageLimit : 0;

  /* ------------------------------------------------------------------------ */
  /* Filters                                                                  */
  /* ------------------------------------------------------------------------ */

  const conditions = [];

  /* ------------------------------------------------------------------------ */
  /* Search                                                                   */
  /*                                                                          */
  /* Searches:                                                                */
  /* - Full Name                                                              */
  /* - Business Name                                                          */
  /* - Phone                                                                   */
  /* - Email                                                                   */
  /* - Subdomain                                                               */
  /* ------------------------------------------------------------------------ */

  if (search?.trim()) {
    const searchValue = `%${search.trim()}%`;

    conditions.push(
      or(
        ilike(admins.fullName, searchValue),
        ilike(admins.businessName, searchValue),
        ilike(admins.phone, searchValue),
        ilike(admins.email, searchValue),
        ilike(admins.subdomain, searchValue),
      ),
    );
  }

  /* ------------------------------------------------------------------------ */
  /* City                                                                     */
  /* ------------------------------------------------------------------------ */

  if (city?.trim()) {
    conditions.push(ilike(admins.city, `%${city.trim()}%`));
  }

  /* ------------------------------------------------------------------------ */
  /* Date From                                                                */
  /* ------------------------------------------------------------------------ */

  if (joinedDate) {
    const startOfDay = new Date(joinedDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(joinedDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    conditions.push(
      and(gte(admins.joinedAt, startOfDay), lte(admins.joinedAt, endOfDay)),
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Status                                                                   */
  /* ------------------------------------------------------------------------ */

  if (status) {
    conditions.push(eq(admins.status, status));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  /* ------------------------------------------------------------------------ */
  /* Fetch Admins + Total Count                                               */
  /* ------------------------------------------------------------------------ */

  const [data, totalResult] = await Promise.all([
    (() => {
      const query = db
        .select({
          id: admins.id,
          fullName: admins.fullName,
          businessName: admins.businessName,
          phone: admins.phone,
          email: admins.email,
          city: admins.city,
          subdomain: admins.subdomain,
          renewalAmount: admins.renewalAmount,
          joinedAt: admins.joinedAt,
          nextRenewalDate: admins.nextRenewalDate,
          status: admins.status,
          createdAt: admins.createdAt,
          updatedAt: admins.updatedAt,
        })
        .from(admins)
        .where(whereClause)
        .orderBy(desc(admins.createdAt));

      if (pageLimit !== undefined) {
        return query.limit(pageLimit).offset(offset);
      }

      return query;
    })(),

    db
      .select({
        count: count(),
      })
      .from(admins)
      .where(whereClause),
  ]);

  /* ------------------------------------------------------------------------ */
  /* Renewal Date                                                             */
  /* ------------------------------------------------------------------------ */

  const adminsWithRenewalDate = data.map((admin) => ({
    ...admin,
    nextRenewalDate:
      admin.nextRenewalDate ?? calculateNextRenewalDate(admin.joinedAt),
  }));

  /* ------------------------------------------------------------------------ */
  /* Total Count                                                              */
  /* ------------------------------------------------------------------------ */

  const total = Number(totalResult[0]?.count ?? 0);

  /* ------------------------------------------------------------------------ */
  /* Pagination                                                               */
  /* ------------------------------------------------------------------------ */

  if (pageLimit !== undefined) {
    const totalPages = Math.ceil(total / pageLimit);

    return {
      data: adminsWithRenewalDate,
      pagination: {
        page: currentPage,
        limit: pageLimit,
        total,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    };
  }

  /* ------------------------------------------------------------------------ */
  /* No Pagination                                                            */
  /* ------------------------------------------------------------------------ */

  return {
    data: adminsWithRenewalDate,
    pagination: {
      page: 1,
      limit: total,
      total,
      totalPages: total > 0 ? 1 : 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Get Admin By ID                                                            */
/* -------------------------------------------------------------------------- */

export async function getAdminById(id: string) {
  const result = await db
    .select()
    .from(admins)
    .where(eq(admins.id, id))
    .limit(1);

  const admin = result[0];

  if (!admin) {
    return null;
  }

  const moduleAccess = await db
    .select({
      moduleId: adminModuleAccess.moduleId,
    })
    .from(adminModuleAccess)
    .where(eq(adminModuleAccess.adminId, id));

  return {
    ...admin,
    moduleIds: moduleAccess.map((access) => access.moduleId),
    nextRenewalDate:
      admin.nextRenewalDate ?? calculateNextRenewalDate(admin.joinedAt),
  };
}

async function validateModuleIds(moduleIds: string[]) {
  if (moduleIds.length === 0) {
    return;
  }

  const uniqueModuleIds = [...new Set(moduleIds)];

  const existingModules = await db
    .select({
      id: modules.id,
    })
    .from(modules)
    .where(or(...uniqueModuleIds.map((moduleId) => eq(modules.id, moduleId))));

  const existingIds = new Set(existingModules.map((module) => module.id));

  const invalidIds = uniqueModuleIds.filter(
    (moduleId) => !existingIds.has(moduleId),
  );

  if (invalidIds.length > 0) {
    throw new Error(`Invalid module IDs: ${invalidIds.join(", ")}`);
  }
}
/* -------------------------------------------------------------------------- */
/* Create Admin                                                               */
/* -------------------------------------------------------------------------- */

export async function createAdmin(data: CreateAdminInput, actorId: string) {
  const email = data.email.trim().toLowerCase();

  const businessName = data.businessName.trim();

  const subdomain = data.subdomain?.trim().toLowerCase() ?? null;

  /* ------------------------------------------------------------------------ */
  /* Validate Business Name                                                   */
  /* ------------------------------------------------------------------------ */

  if (!businessName) {
    throw new Error("Business name is required");
  }

  if (businessName.length > 150) {
    throw new Error("Business name must not exceed 150 characters");
  }

  /* ------------------------------------------------------------------------ */
  /* Validate Email                                                           */
  /* ------------------------------------------------------------------------ */

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    throw new Error("Invalid email address");
  }

  /* ------------------------------------------------------------------------ */
  /* Validate Subdomain                                                       */
  /* ------------------------------------------------------------------------ */

  if (subdomain && !subdomain.endsWith(".ticketing.com")) {
    throw new Error("Subdomain must end with .ticketing.com");
  }

  /* ------------------------------------------------------------------------ */
  /* Validate Renewal Amount                                                  */
  /* ------------------------------------------------------------------------ */

  if (!Number.isFinite(data.renewalAmount) || data.renewalAmount < 0) {
    throw new Error("Invalid renewal amount");
  }

  if (data.moduleIds !== undefined) {
    await validateModuleIds(data.moduleIds);
  }

  /* ------------------------------------------------------------------------ */
  /* Dates                                                                    */
  /* ------------------------------------------------------------------------ */

  const joinedAt = data.joinedAt ?? new Date();

  const firstRenewalDate = new Date(joinedAt);

  firstRenewalDate.setFullYear(firstRenewalDate.getFullYear() + 1);

  /* ------------------------------------------------------------------------ */
  /* Insert Admin                                                             */
  /* ------------------------------------------------------------------------ */

  const result = await db
    .insert(admins)
    .values({
      fullName: data.fullName.trim(),
      businessName,
      phone: data.phone.trim(),
      city: data.city.trim(),
      email,
      subdomain,
      renewalAmount: String(data.renewalAmount),
      joinedAt,
      nextRenewalDate: firstRenewalDate,
      status: data.status ?? "ACTIVE",
    })
    .returning();

  const admin = result[0];

  if (!admin) {
    return null;
  }

  if (data.moduleIds !== undefined && data.moduleIds.length > 0) {
    await db.insert(adminModuleAccess).values(
      data.moduleIds.map((moduleId) => ({
        adminId: admin.id,
        moduleId,
      })),
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Create First Renewal                                                     */
  /* ------------------------------------------------------------------------ */

  await createRenewal(
    {
      adminId: admin.id,
      amount: String(data.renewalAmount),
      startDate: joinedAt,
      dueDate: firstRenewalDate,
      status: "PENDING",
    },
    actorId,
  );

  /* ------------------------------------------------------------------------ */
  /* Audit Log                                                                */
  /* ------------------------------------------------------------------------ */

  await createAuditLog({
    actorId,
    action: "CREATE",
    resourceType: "ADMIN",
    resourceId: admin.id,
    oldValues: null,
    newValues: admin,
  });

  return admin;
}

/* -------------------------------------------------------------------------- */
/* Update Admin                                                               */
/* -------------------------------------------------------------------------- */

export async function updateAdmin(
  id: string,
  data: UpdateAdminInput,
  actorId: string,
) {
  /* ------------------------------------------------------------------------ */
  /* Get Existing Admin                                                       */
  /* ------------------------------------------------------------------------ */

  const existingAdmin = await getAdminById(id);

  if (!existingAdmin) {
    return null;
  }

  /* ------------------------------------------------------------------------ */
  /* Prepare Update                                                           */
  /* ------------------------------------------------------------------------ */

  const updateData: Partial<typeof admins.$inferInsert> = {
    updatedAt: new Date(),
  };

  /* ------------------------------------------------------------------------ */
  /* Full Name                                                                */
  /* ------------------------------------------------------------------------ */

  if (data.fullName !== undefined) {
    const fullName = data.fullName.trim();

    if (!fullName) {
      throw new Error("Full name is required");
    }

    updateData.fullName = fullName;
  }

  /* ------------------------------------------------------------------------ */
  /* Business Name                                                            */
  /* ------------------------------------------------------------------------ */

  if (data.businessName !== undefined) {
    const businessName = data.businessName.trim();

    if (!businessName) {
      throw new Error("Business name is required");
    }

    if (businessName.length > 150) {
      throw new Error("Business name must not exceed 150 characters");
    }

    updateData.businessName = businessName;
  }

  /* ------------------------------------------------------------------------ */
  /* Phone                                                                     */
  /* ------------------------------------------------------------------------ */

  if (data.phone !== undefined) {
    updateData.phone = data.phone.trim();
  }

  /* ------------------------------------------------------------------------ */
  /* City                                                                      */
  /* ------------------------------------------------------------------------ */

  if (data.city !== undefined) {
    updateData.city = data.city.trim();
  }

  /* ------------------------------------------------------------------------ */
  /* Email                                                                     */
  /* ------------------------------------------------------------------------ */

  if (data.email !== undefined) {
    const email = data.email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      throw new Error("Invalid email address");
    }

    updateData.email = email;
  }

  /* ------------------------------------------------------------------------ */
  /* Subdomain                                                                 */
  /* ------------------------------------------------------------------------ */

  if (data.subdomain !== undefined) {
    const value = data.subdomain?.trim().toLowerCase() ?? "";

    if (!value) {
      updateData.subdomain = null;
    } else {
      if (!/^[a-z0-9-]+$/.test(value)) {
        throw new Error(
          "Subdomain can only contain lowercase letters, numbers, and hyphens",
        );
      }

      updateData.subdomain = `${value}.ticketing.com`;
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Renewal Amount                                                            */
  /* ------------------------------------------------------------------------ */

  if (data.renewalAmount !== undefined) {
    if (!Number.isFinite(data.renewalAmount) || data.renewalAmount < 0) {
      throw new Error("Invalid renewal amount");
    }

    updateData.renewalAmount = String(data.renewalAmount);
  }

  /* ------------------------------------------------------------------------ */
  /* Status                                                                    */
  /* ------------------------------------------------------------------------ */

  if (data.status !== undefined) {
    updateData.status = data.status;
  }

  /* ------------------------------------------------------------------------ */
  /* Renewal Cycle                                                             */
  /* ------------------------------------------------------------------------ */

  /* ------------------------------------------------------------------------ */
  /* Renewal Cycle                                                            */
  /* ------------------------------------------------------------------------ */

  let newJoinedAt: Date | undefined;
  let newRenewalDate: Date | undefined;

  /* ------------------------------------------------------------------------ */
  /* Joined Date                                                               */
  /* ------------------------------------------------------------------------ */

  if (data.joinedAt !== undefined) {
    newJoinedAt = new Date(data.joinedAt);

    if (Number.isNaN(newJoinedAt.getTime())) {
      throw new Error("Invalid joined date");
    }

    /*
     * If joinedAt changes, automatically calculate
     * nextRenewalDate as joinedAt + 1 year.
     */
    newRenewalDate = new Date(newJoinedAt);

    newRenewalDate.setFullYear(newRenewalDate.getFullYear() + 1);

    updateData.joinedAt = newJoinedAt;
    updateData.nextRenewalDate = newRenewalDate;
  }

  /* ------------------------------------------------------------------------ */
  /* Next Renewal Date                                                         */
  /* ------------------------------------------------------------------------ */

  if (data.nextRenewalDate !== undefined) {
    const nextRenewalDate = new Date(data.nextRenewalDate);

    if (Number.isNaN(nextRenewalDate.getTime())) {
      throw new Error("Invalid next renewal date");
    }

    /*
     * Explicit nextRenewalDate takes priority over
     * the automatically calculated date.
     */
    newRenewalDate = nextRenewalDate;
    updateData.nextRenewalDate = nextRenewalDate;
  }

  /* ------------------------------------------------------------------------ */
  /* Update Admin                                                             */
  /* ------------------------------------------------------------------------ */

  const result = await db
    .update(admins)
    .set(updateData)
    .where(eq(admins.id, id))
    .returning();

  const admin = result[0];

  if (!admin) {
    throw new Error("Admin not found");
  }

  if (data.moduleIds !== undefined) {
    await validateModuleIds(data.moduleIds);

    await db
      .delete(adminModuleAccess)
      .where(eq(adminModuleAccess.adminId, admin.id));

    if (data.moduleIds.length > 0) {
      await db.insert(adminModuleAccess).values(
        data.moduleIds.map((moduleId) => ({
          adminId: admin.id,
          moduleId,
        })),
      );
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Update Current Pending Renewal                                           */
  /* ------------------------------------------------------------------------ */

  if (newRenewalDate) {
    const renewalUpdateData: Partial<typeof renewals.$inferInsert> = {
      dueDate: newRenewalDate,
      updatedAt: new Date(),
    };

    if (newJoinedAt) {
      renewalUpdateData.startDate = newJoinedAt;
    }

    await db
      .update(renewals)
      .set(renewalUpdateData)
      .where(
        and(eq(renewals.adminId, admin.id), eq(renewals.status, "PENDING")),
      );
  }

  /* ------------------------------------------------------------------------ */
  /* Audit Log                                                                */
  /* ------------------------------------------------------------------------ */

  await createAuditLog({
    actorId,
    action: "UPDATE",
    resourceType: "ADMIN",
    resourceId: admin.id,
    oldValues: existingAdmin,
    newValues: {
      ...admin,
      nextRenewalDate:
        newRenewalDate ??
        admin.nextRenewalDate ??
        calculateNextRenewalDate(admin.joinedAt),
    },
  });

  /* ------------------------------------------------------------------------ */
  /* Response                                                                  */
  /* ------------------------------------------------------------------------ */

  return {
    ...admin,
    nextRenewalDate:
      newRenewalDate ??
      admin.nextRenewalDate ??
      calculateNextRenewalDate(admin.joinedAt),
  };
}

/* -------------------------------------------------------------------------- */
/* Delete Admin                                                               */
/* -------------------------------------------------------------------------- */

export async function deleteAdmin(id: string, actorId: string) {
  const existingAdmin = await getAdminById(id);

  if (!existingAdmin) {
    return null;
  }

  const result = await db.delete(admins).where(eq(admins.id, id)).returning();

  const admin = result[0];

  if (!admin) {
    return null;
  }

  await createAuditLog({
    actorId,
    action: "DELETE",
    resourceType: "ADMIN",
    resourceId: id,
    oldValues: existingAdmin,
    newValues: null,
  });

  return admin;
}
