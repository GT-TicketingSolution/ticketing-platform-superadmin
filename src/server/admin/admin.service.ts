import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";

import { db } from "@/server/db";
import { admins } from "@/server/db/schema";
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
  nextRenewalDate: Date;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
};

export type UpdateAdminInput = Partial<
  Omit<CreateAdminInput, "joinedAt" | "nextRenewalDate">
> & {
  joinedAt?: Date;
  nextRenewalDate?: Date;
};

/* -------------------------------------------------------------------------- */
/* Get All Admins - Search / Filter / Pagination                              */
/* -------------------------------------------------------------------------- */

export type GetAdminsInput = {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
};

export async function getAdmins({
  page = 1,
  limit = 10,
  search,
  city,
  status,
}: GetAdminsInput = {}) {
  const offset = (page - 1) * limit;

  /* ------------------------------------------------------------------------ */
  /* Filters                                                                  */
  /* ------------------------------------------------------------------------ */

  const conditions = [];

  if (search?.trim()) {
    const searchValue = `%${search.trim()}%`;

    conditions.push(
      or(
        ilike(admins.fullName, searchValue),
        ilike(admins.email, searchValue),
        ilike(admins.phone, searchValue),
        ilike(admins.city, searchValue),
        ilike(admins.subdomain, searchValue),
      ),
    );
  }

  if (city?.trim()) {
    conditions.push(ilike(admins.city, city.trim()));
  }

  if (status) {
    conditions.push(eq(admins.status, status));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  /* ------------------------------------------------------------------------ */
  /* Fetch Admins                                                             */
  /* ------------------------------------------------------------------------ */

  const [data, totalResult] = await Promise.all([
    db
      .select({
        id: admins.id,
        fullName: admins.fullName,
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
      .orderBy(desc(admins.createdAt))
      .limit(limit)
      .offset(offset),

    db
      .select({
        count: count(),
      })
      .from(admins)
      .where(whereClause),
  ]);

  const total = Number(totalResult[0]?.count ?? 0);

  return {
    data,

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1,
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

  return result[0] ?? null;
}

/* -------------------------------------------------------------------------- */
/* Create Admin                                                               */
/* -------------------------------------------------------------------------- */

export async function createAdmin(data: CreateAdminInput, actorId: string) {
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

      email: data.email.trim().toLowerCase(),

      subdomain: data.subdomain?.trim().toLowerCase() ?? null,

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

  /* ---------------------------------------------------------------------- */
  /* Create First Renewal                                                   */
  /* ---------------------------------------------------------------------- */

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

  /* ---------------------------------------------------------------------- */
  /* Audit Admin Creation                                                   */
  /* ---------------------------------------------------------------------- */

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
  const existingAdmin = await getAdminById(id);

  if (!existingAdmin) {
    return null;
  }

  const updateData: Partial<typeof admins.$inferInsert> = {
    updatedAt: new Date(),
  };

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
    updateData.email = data.email.trim().toLowerCase();
  }

  if (data.subdomain !== undefined) {
    updateData.subdomain = data.subdomain?.trim().toLowerCase() ?? null;
  }

  if (data.renewalAmount !== undefined) {
    updateData.renewalAmount = data.renewalAmount;
  }

  if (data.joinedAt !== undefined) {
    updateData.joinedAt = data.joinedAt;
  }

  if (data.nextRenewalDate !== undefined) {
    updateData.nextRenewalDate = data.nextRenewalDate;
  }

  if (data.status !== undefined) {
    updateData.status = data.status;
  }

  const result = await db
    .update(admins)
    .set(updateData)
    .where(eq(admins.id, id))
    .returning();

  const admin = result[0];

  if (!admin) {
    return null;
  }

  await createAuditLog({
    actorId,

    action: "UPDATE",

    resourceType: "ADMIN",

    resourceId: admin.id,

    oldValues: existingAdmin,

    newValues: admin,
  });

  return admin;
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
