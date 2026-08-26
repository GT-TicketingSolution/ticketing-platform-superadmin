import { and, asc, count, desc, eq, gte, ilike, lte, or } from "drizzle-orm";

import { db } from "@/server/db";
import { admins, renewals } from "@/server/db/schema";
import { createAuditLog } from "@/server/audit/audit.service";
import { createRenewal } from "@/server/renewal/renewal.service";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type CreateAdminInput = {
  fullName: string;
  phone: string;
  city: string;
  email: string;
  subdomain?: string | null;
  renewalAmount: string;
  joinedAt?: Date;

  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
};

export type UpdateAdminInput = {
  fullName?: string;
  phone?: string;
  city?: string;
  email?: string;
  subdomain?: string | null;
  renewalAmount?: string;
  joinedAt?: Date;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
};

/* -------------------------------------------------------------------------- */
/* Get All Admins - Search / Filter / Pagination                              */
/* -------------------------------------------------------------------------- */

export type GetAdminsInput = {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  dateFrom?: Date;
  dateTo?: Date;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
};

/* -------------------------------------------------------------------------- */
/* Get All Admins - Search / Filter / Pagination                             */
/* -------------------------------------------------------------------------- */

function calculateNextRenewalDate(joinedAt: Date | null) {
  if (!joinedAt) {
    return null;
  }

  const nextRenewalDate = new Date(joinedAt);
  nextRenewalDate.setFullYear(nextRenewalDate.getFullYear() + 1);

  return nextRenewalDate;
}

export async function getAdmins({
  page = 1,
  limit,
  search,
  city,
  dateFrom,
  dateTo,
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
  /* - Phone                                                                   */
  /* - Email                                                                   */
  /* - Subdomain / Domain                                                      */
  /* ------------------------------------------------------------------------ */

  if (search?.trim()) {
    const searchValue = `%${search.trim()}%`;

    conditions.push(
      or(
        ilike(admins.fullName, searchValue),
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
  /*                                                                          */
  /* joinedAt >= dateFrom                                                     */
  /* ------------------------------------------------------------------------ */

  if (dateFrom) {
    conditions.push(gte(admins.joinedAt, dateFrom));
  }

  /* ------------------------------------------------------------------------ */
  /* Date To                                                                  */
  /*                                                                          */
  /* joinedAt <= dateTo                                                       */
  /* ------------------------------------------------------------------------ */

  if (dateTo) {
    conditions.push(lte(admins.joinedAt, dateTo));
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
          phone: admins.phone,
          email: admins.email,
          city: admins.city,
          subdomain: admins.subdomain,
          renewalAmount: admins.renewalAmount,
          joinedAt: admins.joinedAt,
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
  /* Add Calculated Renewal Date                                              */
  /* ------------------------------------------------------------------------ */

  const adminsWithRenewalDate = data.map((admin) => ({
    ...admin,
    nextRenewalDate: calculateNextRenewalDate(admin.joinedAt),
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

  return {
    ...admin,
    nextRenewalDate: calculateNextRenewalDate(admin.joinedAt),
  };
}

export async function createAdmin(data: CreateAdminInput, actorId: string) {
  const email = data.email.trim().toLowerCase();
  const subdomain = data.subdomain?.trim().toLowerCase() ?? null;

  // ----------------------------------------------------------------------
  // Validate Email
  // ----------------------------------------------------------------------

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    throw new Error("Invalid email address");
  }

  // ----------------------------------------------------------------------
  // Validate Subdomain
  // ----------------------------------------------------------------------

  if (subdomain && !subdomain.endsWith(".ticketing.com")) {
    throw new Error("Subdomain must end with .ticketing.com");
  }

  const joinedAt = data.joinedAt ?? new Date();

  // One-year renewal period
  const firstRenewalDate = new Date(joinedAt);
  firstRenewalDate.setFullYear(firstRenewalDate.getFullYear() + 1);

  const result = await db
    .insert(admins)
    .values({
      fullName: data.fullName.trim(),
      phone: data.phone.trim(),
      city: data.city.trim(),
      email,
      subdomain,
      renewalAmount: data.renewalAmount,
      joinedAt,
      nextRenewalDate: firstRenewalDate,
      status: data.status ?? "ACTIVE",
    })
    .returning();

  const admin = result[0];

  if (!admin) {
    return null;
  }

  // ----------------------------------------------------------------------
  // Create First Renewal
  // ----------------------------------------------------------------------

  await createRenewal(
    {
      adminId: admin.id,
      amount: data.renewalAmount,
      startDate: joinedAt,
      dueDate: firstRenewalDate,
      status: "PENDING",
    },
    actorId,
  );

  // ----------------------------------------------------------------------
  // Audit Admin Creation
  // ----------------------------------------------------------------------

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
  /* Normal Fields                                                            */
  /* ------------------------------------------------------------------------ */

  if (data.fullName !== undefined) {
    updateData.fullName = data.fullName.trim();
  }

  if (data.phone !== undefined) {
    updateData.phone = data.phone.trim();
  }

  if (data.city !== undefined) {
    updateData.city = data.city.trim();
  }

  if (data.email !== undefined) {
    const email = data.email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      throw new Error("Invalid email address");
    }

    updateData.email = email;
  }

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

  if (data.renewalAmount !== undefined) {
    updateData.renewalAmount = data.renewalAmount;
  }

  if (data.status !== undefined) {
    updateData.status = data.status;
  }

  /* ------------------------------------------------------------------------ */
  /* Renewal Cycle                                                            */
  /* ------------------------------------------------------------------------ */

  let newJoinedAt: Date | undefined;
  let newRenewalDate: Date | undefined;

  if (data.joinedAt !== undefined) {
    newJoinedAt = new Date(data.joinedAt);

    if (Number.isNaN(newJoinedAt.getTime())) {
      throw new Error("Invalid joined date");
    }

    /*
     * Renewal cycle:
     *
     * joinedAt
     *   +
     * 1 year
     *   =
     * nextRenewalDate
     */

    newRenewalDate = new Date(newJoinedAt);

    newRenewalDate.setFullYear(newRenewalDate.getFullYear() + 1);

    updateData.joinedAt = newJoinedAt;

    /*
     * Keep admin's stored next renewal date
     * synchronized with joined date.
     */

    updateData.nextRenewalDate = newRenewalDate;
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

  /* ------------------------------------------------------------------------ */
  /* Update Current Pending Renewal                                           */
  /* ------------------------------------------------------------------------ */

  if (newJoinedAt && newRenewalDate) {
    /*
     * When the joined date changes, update the current
     * pending renewal to match the new renewal cycle.
     *
     * There should only be one PENDING renewal for an admin.
     */

    await db
      .update(renewals)
      .set({
        startDate: newJoinedAt,
        dueDate: newRenewalDate,
        updatedAt: new Date(),
      })
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
        newRenewalDate ?? calculateNextRenewalDate(admin.joinedAt),
    },
  });

  /* ------------------------------------------------------------------------ */
  /* Response                                                                 */
  /* ------------------------------------------------------------------------ */

  return {
    ...admin,

    nextRenewalDate: newRenewalDate ?? calculateNextRenewalDate(admin.joinedAt),
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
