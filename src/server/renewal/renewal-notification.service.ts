import { and, eq, lte } from "drizzle-orm";

import { db } from "@/server/db";

import { renewals, notifications, platformAdmin } from "@/server/db/schema";

import {
  createNotification,
  updateNotification,
} from "@/server/notification/notification.service";

/* -------------------------------------------------------------------------- */
/* Check Renewal Notifications                                                */
/* -------------------------------------------------------------------------- */

export async function checkRenewalNotifications() {
  const now = new Date();

  const platformAdmins = await db
    .select({
      id: platformAdmin.id,
    })
    .from(platformAdmin)
    .limit(1);

  const currentPlatformAdmin = platformAdmins[0];

  if (!currentPlatformAdmin) {
    throw new Error("Platform admin not found");
  }

  const platformAdminId = currentPlatformAdmin.id;

  const pendingRenewals = await db
    .select()
    .from(renewals)
    .where(eq(renewals.status, "PENDING"));

  let dueSoon = 0;
  let overdue = 0;

  for (const renewal of pendingRenewals) {
    const differenceMs = renewal.dueDate.getTime() - now.getTime();

    const daysRemaining = Math.ceil(differenceMs / (1000 * 60 * 60 * 24));

    /* -------------------------------------------------------------------- */
    /* Existing Renewal Notification                                        */
    /* -------------------------------------------------------------------- */

    const existing = await db
      .select({
        id: notifications.id,
        status: notifications.status,
      })
      .from(notifications)
      .where(
        and(
          eq(notifications.renewalId, renewal.id),
          eq(notifications.type, "RENEWAL"),
        ),
      )
      .limit(1);

    const existingNotification = existing[0];

    /* -------------------------------------------------------------------- */
    /* DUE SOON                                                             */
    /* -------------------------------------------------------------------- */

    if (daysRemaining >= 0 && daysRemaining <= 30) {
      dueSoon++;

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

      if (existingNotification) {
        await updateNotification(existingNotification.id, {
          priority,
          status: "DUE_SOON",
          title: "Renewal Due Soon",
          message,
        });
      } else {
        await createNotification({
          type: "RENEWAL",
          priority,
          status: "DUE_SOON",
          title: "Renewal Due Soon",
          message,
          adminId: renewal.adminId,
          renewalId: renewal.id,
          platformAdminId,
        });
      }

      continue;
    }

    /* -------------------------------------------------------------------- */
    /* OVERDUE                                                              */
    /* -------------------------------------------------------------------- */

    if (daysRemaining < 0) {
      overdue++;

      const daysOverdue = Math.abs(daysRemaining);

      const message =
        daysOverdue === 1
          ? "Your renewal is overdue by 1 day."
          : `Your renewal is overdue by ${daysOverdue} days.`;

      if (existingNotification) {
        await updateNotification(existingNotification.id, {
          priority: "HIGH",
          status: "OVERDUE",
          title: "Renewal Overdue",
          message,
        });
      } else {
        await createNotification({
          type: "RENEWAL",
          priority: "HIGH",
          status: "OVERDUE",
          title: "Renewal Overdue",
          message,
          adminId: renewal.adminId,
          renewalId: renewal.id,
          platformAdminId,
        });
      }
    }
  }

  return {
    dueSoon,
    overdue,
  };
}
