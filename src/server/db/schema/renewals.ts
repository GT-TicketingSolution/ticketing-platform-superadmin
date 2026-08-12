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
