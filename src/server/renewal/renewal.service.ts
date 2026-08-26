// import { and, count, desc, eq, ilike, or } from "drizzle-orm";

// import { db } from "@/server/db";

// import { admins, renewals } from "@/server/db/schema";

// import { notifyRenewalPaid } from "@/server/notification/notification.service";
// import { createAuditLog } from "@/server/audit/audit.service";

// /* -------------------------------------------------------------------------- */
// /* Types                                                                      */
// /* -------------------------------------------------------------------------- */

// export type CreateRenewalInput = {
//   adminId: string;
//   amount: string;
//   startDate: Date;
//   dueDate: Date;
//   status?: "PENDING" | "PAID" | "CANCELLED";
//   paymentDate?: Date | null;
//   paymentMethod?:
//     | "CASH"
//     | "BANK_TRANSFER"
//     | "UPI"
//     | "CARD"
//     | "ONLINE"
//     | "OTHER"
//     | null;
//   transactionReference?: string | null;
//   paymentStatus?: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED" | null;
// };

// export type UpdateRenewalInput = Partial<CreateRenewalInput>;

// /* -------------------------------------------------------------------------- */
// /* Get All Renewals                                                           */
// /* -------------------------------------------------------------------------- */

// /* -------------------------------------------------------------------------- */
// /* Get Renewals - Search / Filter / Pagination                               */
// /* -------------------------------------------------------------------------- */

// export type GetRenewalsInput = {
//   page?: number;
//   limit?: number;
//   search?: string;
//   status?: "PENDING" | "PAID" | "CANCELLED";
//   paymentStatus?: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
//   paymentMethod?:
//     | "CASH"
//     | "BANK_TRANSFER"
//     | "UPI"
//     | "CARD"
//     | "ONLINE"
//     | "OTHER";
//   adminId?: string;
// };

// export async function getRenewals({
//   page = 1,
//   limit = 10,
//   search,
//   status,
//   paymentStatus,
//   paymentMethod,
//   adminId,
// }: GetRenewalsInput = {}) {
//   const offset = (page - 1) * limit;

//   /* ------------------------------------------------------------------------ */
//   /* Filters                                                                  */
//   /* ------------------------------------------------------------------------ */

//   const conditions = [];

//   if (search?.trim()) {
//     const searchValue = `%${search.trim()}%`;

//     conditions.push(
//       or(
//         ilike(admins.fullName, searchValue),
//         ilike(admins.email, searchValue),
//         ilike(admins.phone, searchValue),
//       ),
//     );
//   }

//   if (status) {
//     conditions.push(eq(renewals.status, status));
//   }

//   if (paymentStatus) {
//     conditions.push(eq(renewals.paymentStatus, paymentStatus));
//   }

//   if (paymentMethod) {
//     conditions.push(eq(renewals.paymentMethod, paymentMethod));
//   }

//   if (adminId) {
//     conditions.push(eq(renewals.adminId, adminId));
//   }

//   const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

//   /* ------------------------------------------------------------------------ */
//   /* Fetch + Count                                                            */
//   /* ------------------------------------------------------------------------ */

//   const [data, totalResult] = await Promise.all([
//     db
//       .select({
//         id: renewals.id,
//         adminId: renewals.adminId,

//         adminName: admins.fullName,
//         adminEmail: admins.email,

//         amount: renewals.amount,

//         startDate: renewals.startDate,
//         dueDate: renewals.dueDate,

//         status: renewals.status,

//         paymentDate: renewals.paymentDate,
//         paymentMethod: renewals.paymentMethod,

//         transactionReference: renewals.transactionReference,

//         paymentStatus: renewals.paymentStatus,

//         createdAt: renewals.createdAt,
//         updatedAt: renewals.updatedAt,
//       })
//       .from(renewals)
//       .innerJoin(admins, eq(renewals.adminId, admins.id))
//       .where(whereClause)
//       .orderBy(desc(renewals.dueDate))
//       .limit(limit)
//       .offset(offset),

//     db
//       .select({
//         count: count(),
//       })
//       .from(renewals)
//       .innerJoin(admins, eq(renewals.adminId, admins.id))
//       .where(whereClause),
//   ]);

//   const total = Number(totalResult[0]?.count ?? 0);

//   const totalPages = Math.ceil(total / limit);

//   return {
//     data,

//     pagination: {
//       page,
//       limit,
//       total,
//       totalPages,
//       hasNextPage: page < totalPages,
//       hasPreviousPage: page > 1,
//     },
//   };
// }

// /* -------------------------------------------------------------------------- */
// /* Get Renewal By ID                                                          */
// /* -------------------------------------------------------------------------- */

// export async function getRenewalById(id: string) {
//   const result = await db
//     .select({
//       id: renewals.id,
//       adminId: renewals.adminId,
//       adminName: admins.fullName,
//       adminEmail: admins.email,

//       amount: renewals.amount,

//       startDate: renewals.startDate,
//       dueDate: renewals.dueDate,

//       status: renewals.status,

//       paymentDate: renewals.paymentDate,

//       paymentMethod: renewals.paymentMethod,

//       transactionReference: renewals.transactionReference,

//       paymentStatus: renewals.paymentStatus,

//       createdAt: renewals.createdAt,

//       updatedAt: renewals.updatedAt,
//     })
//     .from(renewals)
//     .innerJoin(admins, eq(renewals.adminId, admins.id))
//     .where(eq(renewals.id, id))
//     .limit(1);

//   return result[0] ?? null;
// }

// /* -------------------------------------------------------------------------- */
// /* Get Admin                                                                  */
// /* -------------------------------------------------------------------------- */

// export async function getAdminById(adminId: string) {
//   const result = await db
//     .select({
//       id: admins.id,
//       fullName: admins.fullName,
//       email: admins.email,
//       joinedAt: admins.joinedAt,
//       nextRenewalDate: admins.nextRenewalDate,
//     })
//     .from(admins)
//     .where(eq(admins.id, adminId))
//     .limit(1);

//   return result[0] ?? null;
// }

// /* -------------------------------------------------------------------------- */
// /* Create Renewal                                                             */
// /* -------------------------------------------------------------------------- */

// export async function createRenewal(data: CreateRenewalInput, actorId: string) {
//   const result = await db
//     .insert(renewals)
//     .values({
//       adminId: data.adminId,

//       amount: data.amount,

//       startDate: data.startDate,

//       dueDate: data.dueDate,

//       status: data.status ?? "PENDING",

//       paymentDate: data.paymentDate ?? null,

//       paymentMethod: data.paymentMethod ?? null,

//       transactionReference: data.transactionReference ?? null,

//       paymentStatus: data.paymentStatus ?? null,
//     })
//     .returning();

//   const renewal = result[0];

//   if (!renewal) {
//     return null;
//   }

//   /* ---------------------------------------------------------------------- */
//   /* Get Admin Details                                                      */
//   /* ---------------------------------------------------------------------- */

//   const admin = await getAdminById(renewal.adminId);

//   /* ---------------------------------------------------------------------- */
//   /* Audit Log                                                              */
//   /* ---------------------------------------------------------------------- */

//   await createAuditLog({
//     actorId,

//     action: "CREATE",

//     resourceType: "RENEWAL",

//     resourceId: renewal.id,

//     oldValues: null,

//     newValues: {
//       ...renewal,

//       adminName: admin?.fullName ?? null,
//     },
//   });

//   return renewal;
// }

// /* -------------------------------------------------------------------------- */
// /* Update Renewal                                                             */
// /* -------------------------------------------------------------------------- */

// export async function updateRenewal(
//   id: string,
//   data: UpdateRenewalInput,
//   actorId: string,
//   platformAdminId: string,
// ) {
//   /* ---------------------------------------------------------------------- */
//   /* Get Existing Renewal                                                   */
//   /* ---------------------------------------------------------------------- */

//   const existingRenewal = await getRenewalById(id);

//   if (!existingRenewal) {
//     return null;
//   }

//   /* ---------------------------------------------------------------------- */
//   /* Prepare Update                                                         */
//   /* ---------------------------------------------------------------------- */

//   const updateData: Partial<typeof renewals.$inferInsert> = {
//     updatedAt: new Date(),
//   };

//   if (data.adminId !== undefined) {
//     updateData.adminId = data.adminId;
//   }

//   if (data.amount !== undefined) {
//     updateData.amount = data.amount;
//   }

//   if (data.startDate !== undefined) {
//     updateData.startDate = data.startDate;
//   }

//   if (data.dueDate !== undefined) {
//     updateData.dueDate = data.dueDate;
//   }

//   if (data.status !== undefined) {
//     updateData.status = data.status;
//   }

//   if (data.paymentDate !== undefined) {
//     updateData.paymentDate = data.paymentDate;
//   }

//   if (data.paymentMethod !== undefined) {
//     updateData.paymentMethod = data.paymentMethod;
//   }

//   if (data.transactionReference !== undefined) {
//     updateData.transactionReference = data.transactionReference;
//   }

//   if (data.paymentStatus !== undefined) {
//     updateData.paymentStatus = data.paymentStatus;
//   }

//   /* ---------------------------------------------------------------------- */
//   /* Update Current Renewal                                                 */
//   /* ---------------------------------------------------------------------- */

//   const result = await db
//     .update(renewals)
//     .set(updateData)
//     .where(eq(renewals.id, id))
//     .returning();

//   const renewal = result[0];

//   if (!renewal) {
//     return null;
//   }

//   /* ---------------------------------------------------------------------- */
//   /* Get Updated Admin                                                      */
//   /* ---------------------------------------------------------------------- */

//   const admin = await getAdminById(renewal.adminId);

//   /* ---------------------------------------------------------------------- */
//   /* Determine Audit Action                                                 */
//   /* ---------------------------------------------------------------------- */

//   const statusChanged =
//     data.status !== undefined && data.status !== existingRenewal.status;

//   const paymentStatusChanged =
//     data.paymentStatus !== undefined &&
//     data.paymentStatus !== existingRenewal.paymentStatus;

//   const auditAction =
//     statusChanged || paymentStatusChanged ? "STATUS_CHANGE" : "UPDATE";

//   /* ---------------------------------------------------------------------- */
//   /* Audit Current Renewal                                                  */
//   /* ---------------------------------------------------------------------- */

//   await createAuditLog({
//     actorId,

//     action: auditAction,

//     resourceType: "RENEWAL",

//     resourceId: renewal.id,

//     oldValues: {
//       ...existingRenewal,
//     },

//     newValues: {
//       ...renewal,

//       adminName: admin?.fullName ?? null,
//     },
//   });

//   /* ---------------------------------------------------------------------- */
//   /* Check Successful Payment                                               */
//   /* ---------------------------------------------------------------------- */

//   const paymentWasSuccessful =
//     data.paymentStatus === "SUCCESS" && data.status === "PAID";

//   /*
//    * Only create the next renewal when the renewal
//    * actually transitions into a successful paid state.
//    *
//    * This prevents creating another renewal if the
//    * same PATCH request is sent again.
//    */

//   const becamePaid =
//     paymentWasSuccessful &&
//     !(
//       existingRenewal.status === "PAID" &&
//       existingRenewal.paymentStatus === "SUCCESS"
//     );

//   if (becamePaid) {
//     /* ------------------------------------------------------------------ */
//     /* Calculate Next One-Year Renewal                                     */
//     /* ------------------------------------------------------------------ */

//     const nextStartDate = new Date(renewal.dueDate);

//     const nextDueDate = new Date(nextStartDate);

//     nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);

//     /* ------------------------------------------------------------------ */
//     /* Check Whether Next Renewal Already Exists                          */
//     /* ------------------------------------------------------------------ */

//     const existingNextRenewal = await db
//       .select({
//         id: renewals.id,
//       })
//       .from(renewals)
//       .where(
//         and(
//           eq(renewals.adminId, renewal.adminId),
//           eq(renewals.startDate, nextStartDate),
//         ),
//       )
//       .limit(1);

//     /* ------------------------------------------------------------------ */
//     /* Create Next Renewal                                                 */
//     /* ------------------------------------------------------------------ */

//     if (!existingNextRenewal[0]) {
//       await createRenewal(
//         {
//           adminId: renewal.adminId,

//           amount: renewal.amount,

//           startDate: nextStartDate,

//           dueDate: nextDueDate,

//           status: "PENDING",

//           paymentDate: null,

//           paymentMethod: null,

//           transactionReference: null,

//           paymentStatus: "PENDING",
//         },
//         actorId,
//       );
//     }

//     /* ------------------------------------------------------------------ */
//     /* Update Admin's Next Renewal Date                                    */
//     /* ------------------------------------------------------------------ */

//     await db
//       .update(admins)
//       .set({
//         nextRenewalDate: nextDueDate,
//         updatedAt: new Date(),
//       })
//       .where(eq(admins.id, renewal.adminId));

//     /* ------------------------------------------------------------------ */
//     /* Payment Notification                                                */
//     /* ------------------------------------------------------------------ */

//     await notifyRenewalPaid(
//       platformAdminId,
//       renewal.adminId,
//       renewal.id,
//       actorId,
//     );
//   }

//   return renewal;
// }

// /* -------------------------------------------------------------------------- */
// /* Get Renewals By Admin                                                      */
// /* -------------------------------------------------------------------------- */

// export async function getRenewalsByAdminId(adminId: string) {
//   return await db
//     .select({
//       id: renewals.id,

//       adminId: renewals.adminId,

//       amount: renewals.amount,

//       startDate: renewals.startDate,

//       dueDate: renewals.dueDate,

//       status: renewals.status,

//       paymentDate: renewals.paymentDate,

//       paymentMethod: renewals.paymentMethod,

//       transactionReference: renewals.transactionReference,

//       paymentStatus: renewals.paymentStatus,

//       createdAt: renewals.createdAt,

//       updatedAt: renewals.updatedAt,
//     })
//     .from(renewals)
//     .where(eq(renewals.adminId, adminId))
//     .orderBy(desc(renewals.startDate));
// }
import { and, count, desc, eq, ilike, or } from "drizzle-orm";

import { db } from "@/server/db";
import { admins, renewals } from "@/server/db/schema";

import { notifyRenewalPaid } from "@/server/notification/notification.service";
import { createAuditLog } from "@/server/audit/audit.service";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type CreateRenewalInput = {
  adminId: string;
  amount: string;
  startDate: Date;
  dueDate: Date;
  status?: "PENDING" | "PAID" | "CANCELLED";
  paymentDate?: Date | null;

  paymentMethod?:
    | "CASH"
    | "BANK_TRANSFER"
    | "UPI"
    | "CARD"
    | "ONLINE"
    | "OTHER"
    | null;

  transactionReference?: string | null;

  paymentStatus?: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED" | null;
};

export type UpdateRenewalInput = Partial<CreateRenewalInput>;

/* -------------------------------------------------------------------------- */
/* Get Renewals - Search / Filter / Pagination                                */
/* -------------------------------------------------------------------------- */

export type GetRenewalsInput = {
  page?: number;
  limit?: number;
  search?: string;
  status?: "PENDING" | "PAID" | "CANCELLED";
  paymentStatus?: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

  paymentMethod?:
    | "CASH"
    | "BANK_TRANSFER"
    | "UPI"
    | "CARD"
    | "ONLINE"
    | "OTHER";

  adminId?: string;
};

/* -------------------------------------------------------------------------- */
/* Calculate Renewal Date                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Renewal date is exactly one year from the admin's joining date.
 */
// function calculateRenewalDate(joinedAt: Date | null) {
//   if (!joinedAt) {
//     return null;
//   }

//   const renewalDate = new Date(joinedAt);

//   renewalDate.setFullYear(renewalDate.getFullYear() + 1);

//   return renewalDate;
// }

/* -------------------------------------------------------------------------- */
/* Get All Renewals                                                           */
/* -------------------------------------------------------------------------- */

export async function getRenewals({
  page = 1,
  limit = 10,
  search,
  status,
  paymentStatus,
  paymentMethod,
  adminId,
}: GetRenewalsInput = {}) {
  const currentPage = Math.max(1, Number(page) || 1);
  const currentLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);

  const offset = (currentPage - 1) * currentLimit;

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
      ),
    );
  }

  if (status) {
    conditions.push(eq(renewals.status, status));
  }

  if (paymentStatus) {
    conditions.push(eq(renewals.paymentStatus, paymentStatus));
  }

  if (paymentMethod) {
    conditions.push(eq(renewals.paymentMethod, paymentMethod));
  }

  if (adminId) {
    conditions.push(eq(renewals.adminId, adminId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  /* ------------------------------------------------------------------------ */
  /* Fetch + Count                                                            */
  /* ------------------------------------------------------------------------ */

  const [data, totalResult] = await Promise.all([
    db
      .select({
        id: renewals.id,
        adminId: renewals.adminId,

        adminName: admins.fullName,
        adminEmail: admins.email,

        adminJoinedAt: admins.joinedAt,

        // This is the current renewal date for the admin.
        adminNextRenewalDate: admins.nextRenewalDate,

        amount: renewals.amount,

        // IMPORTANT:
        // These belong to THIS renewal cycle.
        startDate: renewals.startDate,
        dueDate: renewals.dueDate,

        status: renewals.status,

        paymentDate: renewals.paymentDate,
        paymentMethod: renewals.paymentMethod,

        transactionReference: renewals.transactionReference,

        paymentStatus: renewals.paymentStatus,

        createdAt: renewals.createdAt,
        updatedAt: renewals.updatedAt,
      })
      .from(renewals)
      .innerJoin(admins, eq(renewals.adminId, admins.id))
      .where(whereClause)
      .orderBy(desc(renewals.dueDate))
      .limit(currentLimit)
      .offset(offset),

    db
      .select({
        count: count(),
      })
      .from(renewals)
      .innerJoin(admins, eq(renewals.adminId, admins.id))
      .where(whereClause),
  ]);

  const total = Number(totalResult[0]?.count ?? 0);

  const totalPages = Math.ceil(total / currentLimit);

  return {
    data,

    pagination: {
      page: currentPage,
      limit: currentLimit,
      total,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Get Renewal By ID                                                          */
/* -------------------------------------------------------------------------- */

export async function getRenewalById(id: string) {
  const result = await db
    .select({
      id: renewals.id,
      adminId: renewals.adminId,

      adminName: admins.fullName,
      adminEmail: admins.email,

      adminJoinedAt: admins.joinedAt,
      adminNextRenewalDate: admins.nextRenewalDate,

      amount: renewals.amount,

      startDate: renewals.startDate,
      dueDate: renewals.dueDate,

      status: renewals.status,

      paymentDate: renewals.paymentDate,
      paymentMethod: renewals.paymentMethod,

      transactionReference: renewals.transactionReference,

      paymentStatus: renewals.paymentStatus,

      createdAt: renewals.createdAt,
      updatedAt: renewals.updatedAt,
    })
    .from(renewals)
    .innerJoin(admins, eq(renewals.adminId, admins.id))
    .where(eq(renewals.id, id))
    .limit(1);

  return result[0] ?? null;
}

/* -------------------------------------------------------------------------- */
/* Get Admin                                                                  */
/* -------------------------------------------------------------------------- */

export async function getAdminById(adminId: string) {
  const result = await db
    .select({
      id: admins.id,
      fullName: admins.fullName,
      email: admins.email,

      // IMPORTANT:
      // Include joinedAt because renewal date is based on it.
      joinedAt: admins.joinedAt,

      // Stored current renewal date.
      nextRenewalDate: admins.nextRenewalDate,
    })
    .from(admins)
    .where(eq(admins.id, adminId))
    .limit(1);

  return result[0] ?? null;
}

/* -------------------------------------------------------------------------- */
/* Create Renewal                                                             */
/* -------------------------------------------------------------------------- */

export async function createRenewal(data: CreateRenewalInput, actorId: string) {
  const result = await db
    .insert(renewals)
    .values({
      adminId: data.adminId,

      amount: data.amount,

      startDate: data.startDate,

      dueDate: data.dueDate,

      status: data.status ?? "PENDING",

      paymentDate: data.paymentDate ?? null,

      paymentMethod: data.paymentMethod ?? null,

      transactionReference: data.transactionReference ?? null,

      paymentStatus: data.paymentStatus ?? null,
    })
    .returning();

  const renewal = result[0];

  if (!renewal) {
    return null;
  }

  /* ------------------------------------------------------------------------ */
  /* Get Admin Details                                                        */
  /* ------------------------------------------------------------------------ */

  const admin = await getAdminById(renewal.adminId);

  /* ------------------------------------------------------------------------ */
  /* Audit Log                                                                */
  /* ------------------------------------------------------------------------ */

  await createAuditLog({
    actorId,

    action: "CREATE",

    resourceType: "RENEWAL",

    resourceId: renewal.id,

    oldValues: null,

    newValues: {
      ...renewal,

      adminName: admin?.fullName ?? null,
    },
  });

  return renewal;
}

/* -------------------------------------------------------------------------- */
/* Update Renewal                                                             */
/* -------------------------------------------------------------------------- */

export async function updateRenewal(
  id: string,
  data: UpdateRenewalInput,
  actorId: string,
  platformAdminId: string,
) {
  /* ------------------------------------------------------------------------ */
  /* Get Existing Renewal                                                     */
  /* ------------------------------------------------------------------------ */

  const existingRenewal = await getRenewalById(id);

  if (!existingRenewal) {
    return null;
  }

  /* ------------------------------------------------------------------------ */
  /* Prepare Update                                                           */
  /* ------------------------------------------------------------------------ */

  const updateData: Partial<typeof renewals.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.adminId !== undefined) {
    updateData.adminId = data.adminId;
  }

  if (data.amount !== undefined) {
    updateData.amount = data.amount;
  }

  if (data.startDate !== undefined) {
    updateData.startDate = data.startDate;
  }

  if (data.dueDate !== undefined) {
    updateData.dueDate = data.dueDate;
  }

  if (data.status !== undefined) {
    updateData.status = data.status;
  }

  if (data.paymentDate !== undefined) {
    updateData.paymentDate = data.paymentDate;
  }

  if (data.paymentMethod !== undefined) {
    updateData.paymentMethod = data.paymentMethod;
  }

  if (data.transactionReference !== undefined) {
    updateData.transactionReference = data.transactionReference;
  }

  if (data.paymentStatus !== undefined) {
    updateData.paymentStatus = data.paymentStatus;
  }

  /* ------------------------------------------------------------------------ */
  /* Update Current Renewal                                                   */
  /* ------------------------------------------------------------------------ */

  const result = await db
    .update(renewals)
    .set(updateData)
    .where(eq(renewals.id, id))
    .returning();

  const renewal = result[0];

  if (!renewal) {
    return null;
  }

  /* ------------------------------------------------------------------------ */
  /* Get Updated Admin                                                        */
  /* ------------------------------------------------------------------------ */

  const admin = await getAdminById(renewal.adminId);

  /* ------------------------------------------------------------------------ */
  /* Determine Audit Action                                                   */
  /* ------------------------------------------------------------------------ */

  const statusChanged =
    data.status !== undefined && data.status !== existingRenewal.status;

  const paymentStatusChanged =
    data.paymentStatus !== undefined &&
    data.paymentStatus !== existingRenewal.paymentStatus;

  const auditAction =
    statusChanged || paymentStatusChanged ? "STATUS_CHANGE" : "UPDATE";

  /* ------------------------------------------------------------------------ */
  /* Audit Current Renewal                                                    */
  /* ------------------------------------------------------------------------ */

  await createAuditLog({
    actorId,

    action: auditAction,

    resourceType: "RENEWAL",

    resourceId: renewal.id,

    oldValues: {
      ...existingRenewal,
    },

    newValues: {
      ...renewal,

      adminName: admin?.fullName ?? null,
    },
  });

  /* ------------------------------------------------------------------------ */
  /* Check Successful Payment                                                 */
  /* ------------------------------------------------------------------------ */

  const paymentWasSuccessful =
    data.paymentStatus === "SUCCESS" && data.status === "PAID";

  /*
   * Only create the next renewal when the renewal
   * actually transitions into a successful paid state.
   *
   * This prevents duplicate renewals when the same
   * PATCH request is sent again.
   */

  const becamePaid =
    paymentWasSuccessful &&
    !(
      existingRenewal.status === "PAID" &&
      existingRenewal.paymentStatus === "SUCCESS"
    );

  if (becamePaid) {
    /* ---------------------------------------------------------------------- */
    /* Calculate Next One-Year Renewal                                        */
    /* ---------------------------------------------------------------------- */

    // The next cycle ALWAYS starts from the current
    // renewal's due date.
    const nextStartDate = new Date(renewal.dueDate);

    // One year renewal cycle.
    const nextDueDate = new Date(nextStartDate);

    nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);

    /* ---------------------------------------------------------------------- */
    /* Check Whether Next Renewal Already Exists                              */
    /* ---------------------------------------------------------------------- */

    const existingNextRenewal = await db
      .select({
        id: renewals.id,
      })
      .from(renewals)
      .where(
        and(
          eq(renewals.adminId, renewal.adminId),
          eq(renewals.startDate, nextStartDate),
        ),
      )
      .limit(1);

    /* ---------------------------------------------------------------------- */
    /* Create Next Renewal                                                     */
    /* ---------------------------------------------------------------------- */

    if (!existingNextRenewal[0]) {
      await createRenewal(
        {
          adminId: renewal.adminId,

          amount: renewal.amount,

          startDate: nextStartDate,

          dueDate: nextDueDate,

          status: "PENDING",

          paymentDate: null,

          paymentMethod: null,

          transactionReference: null,

          paymentStatus: "PENDING",
        },
        actorId,
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Update Admin's Current Renewal Date                                    */
    /* ---------------------------------------------------------------------- */

    await db
      .update(admins)
      .set({
        nextRenewalDate: nextDueDate,
        updatedAt: new Date(),
      })
      .where(eq(admins.id, renewal.adminId));

    /* ---------------------------------------------------------------------- */
    /* Payment Notification                                                    */
    /* ---------------------------------------------------------------------- */

    await notifyRenewalPaid(
      platformAdminId,
      renewal.adminId,
      renewal.id,
      actorId,
    );
  }

  return renewal;
}

/* -------------------------------------------------------------------------- */
/* Get Renewals By Admin                                                      */
/* -------------------------------------------------------------------------- */

export async function getRenewalsByAdminId(adminId: string) {
  const result = await db
    .select({
      id: renewals.id,

      adminId: renewals.adminId,

      amount: renewals.amount,

      startDate: renewals.startDate,

      dueDate: renewals.dueDate,

      status: renewals.status,

      paymentDate: renewals.paymentDate,

      paymentMethod: renewals.paymentMethod,

      transactionReference: renewals.transactionReference,

      paymentStatus: renewals.paymentStatus,

      createdAt: renewals.createdAt,

      updatedAt: renewals.updatedAt,
    })
    .from(renewals)
    .where(eq(renewals.adminId, adminId))
    .orderBy(desc(renewals.startDate));

  return result;
}
