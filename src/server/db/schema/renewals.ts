import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  timestamp,
  numeric,
  index,
} from "drizzle-orm/pg-core";

import { admins } from "./admins";

/* -------------------------------------------------------------------------- */
/* Enums                                                                      */
/* -------------------------------------------------------------------------- */

export const renewalStatusEnum = pgEnum("renewal_status", [
  "PENDING",
  "PAID",
  "CANCELLED",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "CASH",
  "BANK_TRANSFER",
  "UPI",
  "CARD",
  "ONLINE",
  "OTHER",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "SUCCESS",
  "FAILED",
  "REFUNDED",
]);

/* -------------------------------------------------------------------------- */
/* Renewals                                                                   */
/* -------------------------------------------------------------------------- */

export const renewals = pgTable(
  "renewals",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    adminId: uuid("admin_id")
      .notNull()
      .references(() => admins.id, {
        onDelete: "cascade",
      }),

    amount: numeric("amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    startDate: timestamp("start_date", {
      withTimezone: true,
    }).notNull(),

    dueDate: timestamp("due_date", {
      withTimezone: true,
    }).notNull(),

    status: renewalStatusEnum("status").default("PENDING").notNull(),

    paymentDate: timestamp("payment_date", {
      withTimezone: true,
    }),

    paymentMethod: paymentMethodEnum("payment_method"),

    transactionReference: varchar("transaction_reference", {
      length: 255,
    }),

    paymentStatus: paymentStatusEnum("payment_status"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    index("renewals_admin_id_idx").on(table.adminId),

    index("renewals_status_idx").on(table.status),

    index("renewals_due_date_idx").on(table.dueDate),
  ],
);
export const renewalNotificationStatusEnum = pgEnum(
  "renewal_notification_status",
  ["SENT", "FAILED"],
);

export const renewalNotificationTypeEnum = pgEnum("renewal_notification_type", [
  "RENEWAL_REMINDER",
]);

export const renewalNotifications = pgTable(
  "renewal_notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    renewalId: uuid("renewal_id")
      .notNull()
      .references(() => renewals.id, {
        onDelete: "cascade",
      }),

    adminId: uuid("admin_id")
      .notNull()
      .references(() => admins.id, {
        onDelete: "cascade",
      }),

    type: renewalNotificationTypeEnum("type")
      .default("RENEWAL_REMINDER")
      .notNull(),

    channel: varchar("channel", {
      length: 20,
    })
      .default("EMAIL")
      .notNull(),

    status: renewalNotificationStatusEnum("status").default("SENT").notNull(),

    recipientEmail: varchar("recipient_email", {
      length: 255,
    }).notNull(),

    subject: varchar("subject", {
      length: 255,
    }).notNull(),

    sentAt: timestamp("sent_at", {
      withTimezone: true,
    }),

    errorMessage: varchar("error_message", {
      length: 1000,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("renewal_notifications_renewal_id_idx").on(table.renewalId),

    index("renewal_notifications_admin_id_idx").on(table.adminId),

    index("renewal_notifications_status_idx").on(table.status),

    index("renewal_notifications_sent_at_idx").on(table.sentAt),
  ],
);
