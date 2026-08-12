import { and, count, desc, eq, ilike, or } from "drizzle-orm";

import { db } from "@/server/db";

import {
  notifications,
  admins,
  renewals,
  adminRequests,
} from "@/server/db/schema";

import { createAuditLog } from "@/server/audit/audit.service";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type CreateNotificationInput = {
  type: "RENEWAL" | "ADMIN_REQUEST" | "SYSTEM" | "SECURITY";

  priority?: "HIGH" | "MEDIUM" | "LOW";

  status?: "OVERDUE" | "DUE_SOON" | "NEW" | "INFO";

  title: string;
  message: string;

  adminId?: string | null;
  platformAdminId?: string | null;

  renewalId?: string | null;
  requestId?: string | null;
};

export type UpdateNotificationInput = {
  priority?: "HIGH" | "MEDIUM" | "LOW";

  status?: "OVERDUE" | "DUE_SOON" | "NEW" | "INFO";

  title?: string;
  message?: string;

  isRead?: boolean;
};

export type GetNotificationsInput = {
  page?: number;
  limit?: number;

  search?: string;

  type?: "RENEWAL" | "ADMIN_REQUEST" | "SYSTEM" | "SECURITY";

  priority?: "HIGH" | "MEDIUM" | "LOW";

  status?: "OVERDUE" | "DUE_SOON" | "NEW" | "INFO";

  isRead?: boolean;

  adminId?: string;

  platformAdminId?: string;
};
/* -------------------------------------------------------------------------- */
/* Get Notifications                                                          */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* Get Notifications - Pagination / Search / Filters                          */
/* -------------------------------------------------------------------------- */

export async function getNotifications({
  page = 1,
  limit = 10,
  search,
  type,
  priority,
  status,
  isRead,
  adminId,
  platformAdminId,
}: GetNotificationsInput = {}) {
  const offset = (page - 1) * limit;

  /* ------------------------------------------------------------------------ */
  /* Filters                                                                  */
  /* ------------------------------------------------------------------------ */

  const conditions = [];

  if (search?.trim()) {
    const searchValue = `%${search.trim()}%`;

    conditions.push(
      or(
        ilike(notifications.title, searchValue),
        ilike(notifications.message, searchValue),
        ilike(admins.fullName, searchValue),
      ),
    );
  }

  if (type) {
    conditions.push(eq(notifications.type, type));
  }

  if (priority) {
    conditions.push(eq(notifications.priority, priority));
  }

  if (status) {
    conditions.push(eq(notifications.status, status));
  }

  if (isRead !== undefined) {
    conditions.push(eq(notifications.isRead, isRead));
  }

  if (adminId) {
    conditions.push(eq(notifications.adminId, adminId));
  }

  if (platformAdminId) {
    conditions.push(eq(notifications.platformAdminId, platformAdminId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  /* ------------------------------------------------------------------------ */
  /* Fetch Notifications + Count                                              */
  /* ------------------------------------------------------------------------ */
  const unreadConditions = [eq(notifications.isRead, false)];

  if (adminId) {
    unreadConditions.push(eq(notifications.adminId, adminId));
  }

  if (platformAdminId) {
    unreadConditions.push(eq(notifications.platformAdminId, platformAdminId));
  }

  const [data, totalResult, unreadResult] = await Promise.all([
    db
      .select({
        id: notifications.id,

        type: notifications.type,
        priority: notifications.priority,
        status: notifications.status,

        title: notifications.title,
        message: notifications.message,

        adminId: notifications.adminId,
        platformAdminId: notifications.platformAdminId,
        adminName: admins.fullName,

        renewalId: notifications.renewalId,
        requestId: notifications.requestId,

        isRead: notifications.isRead,
        readAt: notifications.readAt,

        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .leftJoin(admins, eq(notifications.adminId, admins.id))
      .where(whereClause)
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset),

    db
      .select({
        count: count(),
      })
      .from(notifications)
      .leftJoin(admins, eq(notifications.adminId, admins.id))
      .where(whereClause),

    /* -------------------------------------------------------------------- */
    /* Total Unread Notifications                                           */
    /* -------------------------------------------------------------------- */

    db
      .select({
        count: count(),
      })
      .from(notifications)
      .where(and(...unreadConditions)),
  ]);

  const total = Number(totalResult[0]?.count ?? 0);

  const unreadCount = Number(unreadResult[0]?.count ?? 0);

  const totalPages = Math.ceil(total / limit);

  return {
    data,

    unreadCount,

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
/* Get Notification By ID                                                     */
/* -------------------------------------------------------------------------- */
export async function getNotificationById(
  id: string,
  adminId?: string,
  platformAdminId?: string,
) {
  const conditions = [eq(notifications.id, id)];

  if (adminId) {
    conditions.push(eq(notifications.adminId, adminId));
  }

  if (platformAdminId) {
    conditions.push(eq(notifications.platformAdminId, platformAdminId));
  }
  const result = await db
    .select({
      id: notifications.id,

      type: notifications.type,
      priority: notifications.priority,
      status: notifications.status,

      title: notifications.title,
      message: notifications.message,

      adminId: notifications.adminId,
      platformAdminId: notifications.platformAdminId,
      adminName: admins.fullName,

      renewalId: notifications.renewalId,

      requestId: notifications.requestId,

      isRead: notifications.isRead,
      readAt: notifications.readAt,

      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .leftJoin(admins, eq(notifications.adminId, admins.id))
    .where(and(...conditions))
    .limit(1);

  return result[0] ?? null;
}

/* -------------------------------------------------------------------------- */
/* Create Notification                                                        */
/* -------------------------------------------------------------------------- */

export async function createNotification(
  data: CreateNotificationInput,
  actorId?: string,
) {
  console.log("🔥 CREATE NOTIFICATION DATA:", {
    platformAdminId: data.platformAdminId,
    adminId: data.adminId,
    requestId: data.requestId,
    type: data.type,
    title: data.title,
    actorId,
  });
  const result = await db
    .insert(notifications)
    .values({
      type: data.type,
      priority: data.priority ?? "MEDIUM",
      status: data.status ?? "NEW",
      title: data.title.trim(),
      message: data.message.trim(),

      adminId: data.adminId ?? null,
      platformAdminId: data.platformAdminId ?? null,

      renewalId: data.renewalId ?? null,
      requestId: data.requestId ?? null,
    })
    .returning();

  const notification = result[0];

  if (!notification) {
    return null;
  }

  /* ---------------------------------------------------------------------- */
  /* Audit Log                                                              */
  /* ---------------------------------------------------------------------- */

  if (actorId) {
    const admin = notification.adminId
      ? await db
          .select({
            id: admins.id,
            fullName: admins.fullName,
            email: admins.email,
          })
          .from(admins)
          .where(eq(admins.id, notification.adminId))
          .limit(1)
      : [];

    await createAuditLog({
      actorId,

      action: "NOTIFICATION_SENT",

      resourceType: "NOTIFICATION",

      resourceId: notification.id,

      oldValues: null,

      newValues: {
        ...notification,

        adminName: admin[0]?.fullName ?? null,

        adminEmail: admin[0]?.email ?? null,
      },
    });
  }

  return notification;
}

/* -------------------------------------------------------------------------- */
/* Update Notification                                                        */
/* -------------------------------------------------------------------------- */

export async function updateNotification(
  id: string,
  data: UpdateNotificationInput,
  actorId?: string,
  platformAdminId?: string,
) {
  const existing = await getNotificationById(id, undefined, platformAdminId);

  if (!existing) {
    return null;
  }

  const updateData: Partial<typeof notifications.$inferInsert> = {};

  if (data.priority !== undefined) {
    updateData.priority = data.priority;
  }

  if (data.status !== undefined) {
    updateData.status = data.status;
  }

  if (data.title !== undefined) {
    updateData.title = data.title.trim();
  }

  if (data.message !== undefined) {
    updateData.message = data.message.trim();
  }

  if (data.isRead !== undefined) {
    updateData.isRead = data.isRead;
    updateData.readAt = data.isRead ? new Date() : null;
  }

  if (Object.keys(updateData).length === 0) {
    return existing;
  }

  const updateConditions = [eq(notifications.id, id)];

  if (platformAdminId) {
    updateConditions.push(eq(notifications.platformAdminId, platformAdminId));
  }
  const result = await db
    .update(notifications)
    .set(updateData)
    .where(and(...updateConditions))
    .returning();

  const notification = result[0];

  if (!notification) {
    return null;
  }

  const statusChanged =
    data.status !== undefined && data.status !== existing.status;

  const auditAction = statusChanged ? "STATUS_CHANGE" : "UPDATE";

  if (actorId) {
    await createAuditLog({
      actorId,

      action: auditAction,

      resourceType: "NOTIFICATION",

      resourceId: notification.id,

      oldValues: existing,

      newValues: notification,
    });
  }

  return notification;
}
/* -------------------------------------------------------------------------- */
/* Mark As Read                                                               */
/* -------------------------------------------------------------------------- */

export async function markNotificationAsRead(
  id: string,
  actorId: string,
  platformAdminId?: string,
) {
  const existing = await getNotificationById(id, undefined, platformAdminId);

  if (!existing) {
    return null;
  }

  const conditions = [eq(notifications.id, id)];

  if (platformAdminId) {
    conditions.push(eq(notifications.platformAdminId, platformAdminId));
  }

  const result = await db
    .update(notifications)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(and(...conditions))
    .returning();

  const notification = result[0];

  if (!notification) {
    return null;
  }

  await createAuditLog({
    actorId,
    action: "UPDATE",
    resourceType: "NOTIFICATION",
    resourceId: notification.id,
    oldValues: existing,
    newValues: notification,
  });

  return notification;
}

/* -------------------------------------------------------------------------- */
/* Mark As Unread                                                             */
/* -------------------------------------------------------------------------- */

export async function markNotificationAsUnread(
  id: string,
  actorId: string,
  platformAdminId?: string,
) {
  const existing = await getNotificationById(id, undefined, platformAdminId);

  if (!existing) {
    return null;
  }

  const conditions = [eq(notifications.id, id)];

  if (platformAdminId) {
    conditions.push(eq(notifications.platformAdminId, platformAdminId));
  }

  const result = await db
    .update(notifications)
    .set({
      isRead: false,
      readAt: null,
    })
    .where(and(...conditions))
    .returning();

  const notification = result[0];

  if (!notification) {
    return null;
  }

  await createAuditLog({
    actorId,
    action: "UPDATE",
    resourceType: "NOTIFICATION",
    resourceId: notification.id,
    oldValues: existing,
    newValues: notification,
  });

  return notification;
}

/* -------------------------------------------------------------------------- */
/* Delete Notification                                                        */
/* -------------------------------------------------------------------------- */

export async function deleteNotification(
  id: string,
  actorId: string,
  platformAdminId?: string,
) {
  const existing = await getNotificationById(id, undefined, platformAdminId);

  if (!existing) {
    return null;
  }

  const conditions = [eq(notifications.id, id)];

  if (platformAdminId) {
    conditions.push(eq(notifications.platformAdminId, platformAdminId));
  }

  const result = await db
    .delete(notifications)
    .where(and(...conditions))
    .returning();

  const notification = result[0];

  if (!notification) {
    return null;
  }

  await createAuditLog({
    actorId,
    action: "DELETE",
    resourceType: "NOTIFICATION",
    resourceId: notification.id,
    oldValues: existing,
    newValues: null,
  });

  return notification;
}

/* -------------------------------------------------------------------------- */
/* Notify Admin Request Created                                               */
/* -------------------------------------------------------------------------- */

export async function notifyAdminRequestCreated(
  platformAdminId: string,
  adminId: string,
  requestId: string,
  requestNumber: string,
  actorId?: string,
) {
  return createNotification(
    {
      type: "ADMIN_REQUEST",
      priority: "MEDIUM",
      status: "NEW",
      title: "New Admin Request",
      message: `A new admin request ${requestNumber} has been created.`,

      platformAdminId,
      adminId,

      requestId,
    },
    actorId,
  );
}

export async function notifyAdminRequestAccepted(
  platformAdminId: string,
  adminId: string,
  requestId: string,
  requestNumber: string,
  actorId?: string,
) {
  return createNotification(
    {
      type: "ADMIN_REQUEST",
      priority: "MEDIUM",
      status: "INFO",
      title: "Admin Request Accepted",
      message: `Your admin request ${requestNumber} has been accepted.`,
      platformAdminId,
      adminId,
      requestId,
    },
    actorId,
  );
}

export async function notifyAdminRequestRejected(
  platformAdminId: string,
  adminId: string,
  requestId: string,
  requestNumber: string,
  actorId?: string,
) {
  return createNotification(
    {
      type: "ADMIN_REQUEST",
      priority: "HIGH",
      status: "INFO",
      title: "Admin Request Rejected",
      message: `Your admin request ${requestNumber} has been rejected.`,
      platformAdminId,
      adminId,
      requestId,
    },
    actorId,
  );
}

export async function notifyAdminRequestInProgress(
  platformAdminId: string,
  adminId: string,
  requestId: string,
  requestNumber: string,
  actorId?: string,
) {
  return createNotification(
    {
      type: "ADMIN_REQUEST",
      priority: "MEDIUM",
      status: "INFO",
      title: "Admin Request In Progress",
      message: `Your admin request ${requestNumber} is now in progress.`,
      platformAdminId,
      adminId,
      requestId,
    },
    actorId,
  );
}

export async function notifyAdminRequestCancelled(
  platformAdminId: string,
  adminId: string,
  requestId: string,
  requestNumber: string,
  actorId?: string,
) {
  return createNotification(
    {
      type: "ADMIN_REQUEST",
      priority: "MEDIUM",
      status: "INFO",
      title: "Admin Request Cancelled",
      message: `Your admin request ${requestNumber} has been cancelled.`,
      platformAdminId,
      adminId,
      requestId,
    },
    actorId,
  );
}

/* -------------------------------------------------------------------------- */
/* Notify Renewal Due Soon                                                    */
/* -------------------------------------------------------------------------- */

export async function notifyRenewalDueSoon(
  platformAdminId: string,
  adminId: string,
  renewalId: string,
  daysRemaining: number,
  actorId?: string,
) {
  let message: string;

  if (daysRemaining === 0) {
    message = "Your renewal is due today.";
  } else if (daysRemaining === 1) {
    message = "Your renewal is due tomorrow.";
  } else {
    message = `Your renewal is due in ${daysRemaining} days.`;
  }

  let priority: "LOW" | "MEDIUM" | "HIGH";

  if (daysRemaining <= 10) {
    priority = "HIGH";
  } else if (daysRemaining <= 20) {
    priority = "MEDIUM";
  } else {
    priority = "LOW";
  }

  return await createNotification(
    {
      type: "RENEWAL",
      priority,
      status: "DUE_SOON",
      title: "Renewal Due Soon",
      message,
      platformAdminId,
      adminId,
      renewalId,
    },
    actorId,
  );
}
/* -------------------------------------------------------------------------- */
/* Notify Renewal Overdue                                                     */
/* -------------------------------------------------------------------------- */

export async function notifyRenewalOverdue(
  platformAdminId: string,
  adminId: string,
  renewalId: string,
  daysOverdue: number,
  actorId?: string,
) {
  const message =
    daysOverdue === 1
      ? "Your renewal is overdue by 1 day."
      : `Your renewal is overdue by ${daysOverdue} days.`;

  return await createNotification(
    {
      type: "RENEWAL",
      priority: "HIGH",
      status: "OVERDUE",
      title: "Renewal Overdue",
      message,
      platformAdminId,
      adminId,
      renewalId,
    },
    actorId,
  );
}

/* -------------------------------------------------------------------------- */
/* Notify Renewal Paid                                                        */
/* -------------------------------------------------------------------------- */

export async function notifyRenewalPaid(
  platformAdminId: string,
  adminId: string,
  renewalId: string,
  actorId?: string,
) {
  return await createNotification(
    {
      type: "RENEWAL",
      priority: "MEDIUM",
      status: "INFO",
      title: "Renewal Payment Received",
      message: "The renewal payment has been successfully recorded.",
      platformAdminId,
      adminId,
      renewalId,
    },
    actorId,
  );
}

/* -------------------------------------------------------------------------- */
/* Mark All Notifications As Read                                             */
/* -------------------------------------------------------------------------- */

export async function markAllNotificationsAsRead(platformAdminId: string) {
  const result = await db
    .update(notifications)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(
      and(
        eq(notifications.platformAdminId, platformAdminId),
        eq(notifications.isRead, false),
      ),
    )
    .returning({
      id: notifications.id,
    });

  return {
    updatedCount: result.length,
  };
}
