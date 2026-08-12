import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  index,
} from "drizzle-orm/pg-core";

import { admins } from "./admins";
import { adminRequests } from "./admin-requests";
import { renewals } from "./renewals";
import { platformAdmin } from "./platform-admin";

/* -------------------------------------------------------------------------- */
/* Notification Type                                                          */
/* -------------------------------------------------------------------------- */

export const notificationTypeEnum = pgEnum("notification_type", [
  "RENEWAL",
  "ADMIN_REQUEST",
  "SYSTEM",
  "SECURITY",
]);

/* -------------------------------------------------------------------------- */
/* Notification Priority                                                      */
/* -------------------------------------------------------------------------- */

export const notificationPriorityEnum = pgEnum("notification_priority", [
  "HIGH",
  "MEDIUM",
  "LOW",
]);

/* -------------------------------------------------------------------------- */
/* Notification Status                                                        */
/* -------------------------------------------------------------------------- */

export const notificationStatusEnum = pgEnum("notification_status", [
  "OVERDUE",
  "DUE_SOON",
  "NEW",
  "INFO",
]);

/* -------------------------------------------------------------------------- */
/* Notifications                                                              */
/* -------------------------------------------------------------------------- */

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    /* What kind of notification is this? */

    type: notificationTypeEnum("type").notNull(),

    /* HIGH / MEDIUM / LOW */

    priority: notificationPriorityEnum("priority").default("MEDIUM").notNull(),

    /* OVERDUE / DUE_SOON / NEW / INFO */

    status: notificationStatusEnum("status").default("NEW").notNull(),

    /* ---------------------------------------------------------------------- */
    /* Display Information                                                    */
    /* ---------------------------------------------------------------------- */

    title: varchar("title", {
      length: 255,
    }).notNull(),

    message: text("message").notNull(),

    /* ---------------------------------------------------------------------- */
    /* Related Records                                                        */
    /* ---------------------------------------------------------------------- */

    /* ---------------------------------------------------------------------- */
    /* Related Records                                                        */
    /* ---------------------------------------------------------------------- */

    platformAdminId: uuid("platform_admin_id").references(
      () => platformAdmin.id,
      {
        onDelete: "cascade",
      },
    ),

    adminId: uuid("admin_id").references(() => admins.id, {
      onDelete: "set null",
    }),

    renewalId: uuid("renewal_id").references(() => renewals.id, {
      onDelete: "set null",
    }),

    requestId: uuid("request_id").references(() => adminRequests.id, {
      onDelete: "set null",
    }),

    /* ---------------------------------------------------------------------- */
    /* Read State                                                             */
    /* ---------------------------------------------------------------------- */

    isRead: boolean("is_read").default(false).notNull(),

    readAt: timestamp("read_at", {
      withTimezone: true,
    }),

    /* ---------------------------------------------------------------------- */
    /* Timestamp                                                              */
    /* ---------------------------------------------------------------------- */

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    index("notifications_platform_admin_id_idx").on(table.platformAdminId),
    index("notifications_type_idx").on(table.type),

    index("notifications_priority_idx").on(table.priority),

    index("notifications_status_idx").on(table.status),

    index("notifications_is_read_idx").on(table.isRead),

    index("notifications_admin_id_idx").on(table.adminId),

    index("notifications_renewal_id_idx").on(table.renewalId),

    index("notifications_request_id_idx").on(table.requestId),

    index("notifications_created_at_idx").on(table.createdAt),
  ],
);
