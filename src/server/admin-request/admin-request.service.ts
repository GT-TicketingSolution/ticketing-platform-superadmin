import { desc, eq, count, ilike, or, and } from "drizzle-orm";

import { db } from "@/server/db";

import { adminRequests, admins } from "@/server/db/schema";

import {
  notifyAdminRequestInProgress,
  notifyAdminRequestAccepted,
  notifyAdminRequestRejected,
  notifyAdminRequestCancelled,
  notifyAdminRequestCreated,
} from "@/server/notification/notification.service";

import { createAuditLog } from "@/server/audit/audit.service";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type CreateAdminRequestInput = {
  adminId: string | null;

  fullName: string;
  phone: string;
  email: string;
  city?: string | null;

  description: string;
  internalNotes?: string | null;
};

export type UpdateAdminRequestInput = {
  description?: string;
  internalNotes?: string | null;
  status?: "PENDING" | "IN_PROGRESS" | "ACCEPTED" | "REJECTED" | "CANCELLED";

  // Admin fields
  fullName?: string;
  phone?: string;
  email?: string;
  city?: string;
};

/* -------------------------------------------------------------------------- */
/* Generate Request Number                                                    */
/* -------------------------------------------------------------------------- */

async function generateRequestNumber() {
  const year = new Date().getFullYear();

  const prefix = `REQ-${year}-`;

  const latest = await db
    .select({
      requestNumber: adminRequests.requestNumber,
    })
    .from(adminRequests)
    .orderBy(desc(adminRequests.createdAt))
    .limit(1);

  let nextNumber = 1;

  const latestNumber = latest[0]?.requestNumber;

  if (latestNumber?.startsWith(prefix)) {
    const numericPart = latestNumber.replace(prefix, "");

    const parsed = Number(numericPart);

    if (!Number.isNaN(parsed)) {
      nextNumber = parsed + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(5, "0")}`;
}

/* -------------------------------------------------------------------------- */
/* Get Admin Requests - Pagination / Search / Filter                          */
/* -------------------------------------------------------------------------- */

export type GetAdminRequestsInput = {
  page?: number;
  limit?: number;
  search?: string;
  status?: "PENDING" | "IN_PROGRESS" | "ACCEPTED" | "REJECTED" | "CANCELLED";
  adminId?: string;
  city?: string;
};

export async function getAdminRequests({
  page = 1,
  limit = 10,
  search,
  status,
  adminId,
  city,
}: GetAdminRequestsInput = {}) {
  const offset = (page - 1) * limit;

  const conditions = [];

  if (search?.trim()) {
    const searchValue = `%${search.trim()}%`;

    conditions.push(
      or(
        ilike(adminRequests.requestNumber, searchValue),
        ilike(adminRequests.description, searchValue),

        // Request's stored applicant details
        ilike(adminRequests.fullName, searchValue),
        ilike(adminRequests.phone, searchValue),
        ilike(adminRequests.email, searchValue),
        ilike(adminRequests.city, searchValue),

        // Existing Admin details, if linked
        ilike(admins.fullName, searchValue),
        ilike(admins.phone, searchValue),
        ilike(admins.email, searchValue),
        ilike(admins.city, searchValue),
      ),
    );
  }

  if (status) {
    conditions.push(eq(adminRequests.status, status));
  }

  if (adminId) {
    conditions.push(eq(adminRequests.adminId, adminId));
  }

  if (city?.trim()) {
    conditions.push(ilike(adminRequests.city, city.trim()));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, totalResult] = await Promise.all([
    db
      .select({
        id: adminRequests.id,
        requestNumber: adminRequests.requestNumber,
        adminId: adminRequests.adminId,

        // Stored request/applicant details
        requestName: adminRequests.fullName,
        requestPhone: adminRequests.phone,
        requestEmail: adminRequests.email,
        requestCity: adminRequests.city,

        // Existing Admin details
        adminName: admins.fullName,
        adminPhone: admins.phone,
        adminEmail: admins.email,
        adminCity: admins.city,

        description: adminRequests.description,
        internalNotes: adminRequests.internalNotes,
        status: adminRequests.status,

        createdAt: adminRequests.createdAt,
        updatedAt: adminRequests.updatedAt,
      })
      .from(adminRequests)
      .leftJoin(admins, eq(adminRequests.adminId, admins.id))
      .where(whereClause)
      .orderBy(desc(adminRequests.createdAt))
      .limit(limit)
      .offset(offset),

    db
      .select({
        count: count(),
      })
      .from(adminRequests)
      .leftJoin(admins, eq(adminRequests.adminId, admins.id))
      .where(whereClause),
  ]);

  const total = Number(totalResult[0]?.count ?? 0);
  const totalPages = Math.ceil(total / limit);

  const formattedData = data.map((request) => ({
    id: request.id,
    requestNumber: request.requestNumber,
    adminId: request.adminId,

    // Use Admin table when available,
    // otherwise use details stored in the request.
    name: request.adminName ?? request.requestName,
    phone: request.adminPhone ?? request.requestPhone,
    email: request.adminEmail ?? request.requestEmail,
    city: request.adminCity ?? request.requestCity,

    desc: request.description,
    notes: request.internalNotes ?? "",

    status:
      request.status === "PENDING"
        ? "Pending"
        : request.status === "IN_PROGRESS"
          ? "In-progress"
          : request.status === "ACCEPTED"
            ? "Accepted"
            : request.status === "REJECTED"
              ? "Rejected"
              : "Canceled",

    createdDate: request.createdAt.toISOString().slice(0, 10),

    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  }));

  return {
    data: formattedData,

    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Get Request By ID                                                          */
/* -------------------------------------------------------------------------- */

export async function getAdminRequestById(id: string) {
  const result = await db
    .select({
      id: adminRequests.id,
      requestNumber: adminRequests.requestNumber,
      adminId: adminRequests.adminId,

      // Stored request details
      requestName: adminRequests.fullName,
      requestPhone: adminRequests.phone,
      requestEmail: adminRequests.email,
      requestCity: adminRequests.city,

      // Existing Admin details
      adminName: admins.fullName,
      adminPhone: admins.phone,
      adminEmail: admins.email,
      adminCity: admins.city,

      description: adminRequests.description,
      internalNotes: adminRequests.internalNotes,
      status: adminRequests.status,

      createdAt: adminRequests.createdAt,
      updatedAt: adminRequests.updatedAt,
    })
    .from(adminRequests)
    .leftJoin(admins, eq(adminRequests.adminId, admins.id))
    .where(eq(adminRequests.id, id))
    .limit(1);

  const request = result[0];

  if (!request) {
    return null;
  }

  return {
    id: request.id,
    requestNumber: request.requestNumber,
    adminId: request.adminId,

    name: request.adminName ?? request.requestName,
    phone: request.adminPhone ?? request.requestPhone,
    email: request.adminEmail ?? request.requestEmail,
    city: request.adminCity ?? request.requestCity,

    desc: request.description,
    notes: request.internalNotes ?? "",

    status:
      request.status === "PENDING"
        ? "Pending"
        : request.status === "IN_PROGRESS"
          ? "In-progress"
          : request.status === "ACCEPTED"
            ? "Accepted"
            : request.status === "REJECTED"
              ? "Rejected"
              : "Canceled",

    createdDate: request.createdAt.toISOString().slice(0, 10),

    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

/* -------------------------------------------------------------------------- */
/* Check Admin                                                                */
/* -------------------------------------------------------------------------- */

export async function getAdminById(adminId: string) {
  const result = await db
    .select({
      id: admins.id,
      fullName: admins.fullName,
      phone: admins.phone,
      email: admins.email,
      city: admins.city,
    })
    .from(admins)
    .where(eq(admins.id, adminId))
    .limit(1);

  return result[0] ?? null;
}

/* -------------------------------------------------------------------------- */
/* Create Request                                                             */
/* -------------------------------------------------------------------------- */
export async function createAdminRequest(
  data: CreateAdminRequestInput,
  actorId: string,
) {
  const requestNumber = await generateRequestNumber();

  const result = await db
    .insert(adminRequests)
    .values({
      requestNumber,

      // Can be NULL when Admin account does not exist yet
      adminId: data.adminId ?? null,

      // Store applicant/request details
      fullName: data.fullName.trim(),
      phone: data.phone.trim(),
      email: data.email.trim().toLowerCase(),
      city: data.city?.trim() || null,

      description: data.description.trim(),
      internalNotes: data.internalNotes?.trim() || null,
      status: "PENDING",
    })
    .returning();

  const request = result[0];

  if (!request) {
    return null;
  }

  // Get existing Admin only when one exists
  const admin = request.adminId ? await getAdminById(request.adminId) : null;

  await createAuditLog({
    actorId,

    action: "CREATE",

    resourceType: "ADMIN_REQUEST",

    resourceId: request.id,

    oldValues: null,

    newValues: {
      ...request,

      adminName: admin?.fullName ?? request.fullName,
      adminPhone: admin?.phone ?? request.phone,
      adminEmail: admin?.email ?? request.email,
      adminCity: admin?.city ?? request.city,
    },
  });

  // Only notify an existing Admin
  if (request.adminId) {
    await notifyAdminRequestCreated(
      actorId,
      request.adminId,
      request.id,
      request.requestNumber,
      actorId,
    );
  }

  return await getAdminRequestById(request.id);
}
/* -------------------------------------------------------------------------- */
/* Update Request                                                             */
/* -------------------------------------------------------------------------- */

export async function updateAdminRequest(
  id: string,
  data: UpdateAdminRequestInput,
  actorId: string,
) {
  /* ---------------------------------------------------------------------- */
  /* Get Existing Request                                                   */
  /* ---------------------------------------------------------------------- */

  const existingRequest = await getAdminRequestById(id);

  if (!existingRequest) {
    return null;
  }

  /* ---------------------------------------------------------------------- */
  /* Update Request                                                         */
  /* ---------------------------------------------------------------------- */

  const requestUpdateData: Partial<typeof adminRequests.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.description !== undefined) {
    requestUpdateData.description = data.description.trim();
  }

  if (data.internalNotes !== undefined) {
    requestUpdateData.internalNotes =
      data.internalNotes === null ? null : data.internalNotes.trim();
  }

  if (data.status !== undefined) {
    requestUpdateData.status = data.status;
  }

  /*
   * ----------------------------------------------------------------------
   * Update Applicant Details Stored On Request
   * ----------------------------------------------------------------------
   *
   * These fields are important when adminId is NULL because there is
   * no Admin record yet.
   */

  if (data.fullName !== undefined) {
    requestUpdateData.fullName = data.fullName.trim();
  }

  if (data.phone !== undefined) {
    requestUpdateData.phone = data.phone.trim();
  }

  if (data.email !== undefined) {
    requestUpdateData.email = data.email.trim().toLowerCase();
  }

  if (data.city !== undefined) {
    requestUpdateData.city = data.city.trim();
  }

  /* ---------------------------------------------------------------------- */
  /* Update Existing Admin                                                  */
  /* ---------------------------------------------------------------------- */

  const adminUpdateData: Partial<typeof admins.$inferInsert> = {
    updatedAt: new Date(),
  };

  let shouldUpdateAdmin = false;

  if (data.fullName !== undefined) {
    adminUpdateData.fullName = data.fullName.trim();
    shouldUpdateAdmin = true;
  }

  if (data.phone !== undefined) {
    adminUpdateData.phone = data.phone.trim();
    shouldUpdateAdmin = true;
  }

  if (data.email !== undefined) {
    adminUpdateData.email = data.email.trim().toLowerCase();
    shouldUpdateAdmin = true;
  }

  if (data.city !== undefined) {
    adminUpdateData.city = data.city.trim();
    shouldUpdateAdmin = true;
  }

  /* ---------------------------------------------------------------------- */
  /* Update Request                                                          */
  /* ---------------------------------------------------------------------- */

  const requestResult = await db
    .update(adminRequests)
    .set(requestUpdateData)
    .where(eq(adminRequests.id, id))
    .returning();

  const updatedRequest = requestResult[0];

  if (!updatedRequest) {
    return null;
  }

  /* ---------------------------------------------------------------------- */
  /* Update Admin Only If Admin Exists                                      */
  /* ---------------------------------------------------------------------- */

  if (shouldUpdateAdmin && updatedRequest.adminId) {
    await db
      .update(admins)
      .set(adminUpdateData)
      .where(eq(admins.id, updatedRequest.adminId));
  }

  /* ---------------------------------------------------------------------- */
  /* Get Updated Admin                                                      */
  /* ---------------------------------------------------------------------- */

  const updatedAdmin = updatedRequest.adminId
    ? await getAdminById(updatedRequest.adminId)
    : null;

  /* ---------------------------------------------------------------------- */
  /* Determine Audit Action                                                 */
  /* ---------------------------------------------------------------------- */

  const statusChanged =
    data.status !== undefined && data.status !== existingRequest.status;

  const auditAction = statusChanged ? "STATUS_CHANGE" : "UPDATE";

  /* ---------------------------------------------------------------------- */
  /* Audit Log                                                              */
  /* ---------------------------------------------------------------------- */

  await createAuditLog({
    actorId,

    action: auditAction,

    resourceType: "ADMIN_REQUEST",

    resourceId: updatedRequest.id,

    oldValues: {
      ...existingRequest,
    },

    newValues: {
      ...updatedRequest,

      adminName: updatedAdmin?.fullName ?? updatedRequest.fullName ?? null,

      adminPhone: updatedAdmin?.phone ?? updatedRequest.phone ?? null,

      adminEmail: updatedAdmin?.email ?? updatedRequest.email ?? null,

      adminCity: updatedAdmin?.city ?? updatedRequest.city ?? null,
    },
  });

  /* ---------------------------------------------------------------------- */
  /* Notifications                                                         */
  /* ---------------------------------------------------------------------- */

  /*
   * A request without an Admin cannot receive an Admin notification.
   *
   * This is expected for the first Admin request.
   */

  if (statusChanged && updatedRequest.adminId) {
    switch (updatedRequest.status) {
      case "IN_PROGRESS":
        await notifyAdminRequestInProgress(
          actorId,
          updatedRequest.adminId,
          updatedRequest.id,
          updatedRequest.requestNumber,
          actorId,
        );
        break;

      case "ACCEPTED":
        await notifyAdminRequestAccepted(
          actorId,
          updatedRequest.adminId,
          updatedRequest.id,
          updatedRequest.requestNumber,
          actorId,
        );
        break;

      case "REJECTED":
        await notifyAdminRequestRejected(
          actorId,
          updatedRequest.adminId,
          updatedRequest.id,
          updatedRequest.requestNumber,
          actorId,
        );
        break;

      case "CANCELLED":
        await notifyAdminRequestCancelled(
          actorId,
          updatedRequest.adminId,
          updatedRequest.id,
          updatedRequest.requestNumber,
          actorId,
        );
        break;

      case "PENDING":
        // No notification needed
        break;
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Return Fresh Data                                                      */
  /* ---------------------------------------------------------------------- */

  return await getAdminRequestById(updatedRequest.id);
}

/* -------------------------------------------------------------------------- */
/* Delete Request                                                             */
/* -------------------------------------------------------------------------- */

export async function deleteAdminRequest(id: string, actorId: string) {
  /* ---------------------------------------------------------------------- */
  /* Get Existing Request                                                   */
  /* ---------------------------------------------------------------------- */

  const existingRequest = await getAdminRequestById(id);

  if (!existingRequest) {
    return null;
  }

  /* ---------------------------------------------------------------------- */
  /* Delete Request                                                         */
  /* ---------------------------------------------------------------------- */

  const result = await db
    .delete(adminRequests)
    .where(eq(adminRequests.id, id))
    .returning();

  const request = result[0];

  if (!request) {
    return null;
  }

  /* ---------------------------------------------------------------------- */
  /* Audit Log                                                              */
  /* ---------------------------------------------------------------------- */

  await createAuditLog({
    actorId,

    action: "DELETE",

    resourceType: "ADMIN_REQUEST",

    resourceId: request.id,

    oldValues: {
      ...existingRequest,
    },

    newValues: null,
  });

  return request;
}

export async function findAdminForRequest({
  adminId,
  name,
  phone,
  email,
}: {
  adminId?: string | null;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
}) {
  // 1. If adminId is provided, use it directly
  if (adminId?.trim()) {
    return getAdminById(adminId.trim());
  }

  // 2. Prefer exact email match
  if (email?.trim()) {
    const result = await db
      .select({
        id: admins.id,
        fullName: admins.fullName,
        phone: admins.phone,
        email: admins.email,
        city: admins.city,
      })
      .from(admins)
      .where(eq(admins.email, email.trim().toLowerCase()))
      .limit(1);

    if (result[0]) {
      return result[0];
    }
  }

  // 3. Then exact phone match
  if (phone?.trim()) {
    const result = await db
      .select({
        id: admins.id,
        fullName: admins.fullName,
        phone: admins.phone,
        email: admins.email,
        city: admins.city,
      })
      .from(admins)
      .where(eq(admins.phone, phone.trim()))
      .limit(1);

    if (result[0]) {
      return result[0];
    }
  }

  // 4. Finally name match
  if (name?.trim()) {
    const result = await db
      .select({
        id: admins.id,
        fullName: admins.fullName,
        phone: admins.phone,
        email: admins.email,
        city: admins.city,
      })
      .from(admins)
      .where(ilike(admins.fullName, name.trim()))
      .limit(1);

    return result[0] ?? null;
  }

  return null;
}
