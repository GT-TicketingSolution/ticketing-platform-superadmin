import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { admins } from "./admins";

export const adminRequestStatusEnum = pgEnum("admin_request_status", [
  "PENDING",
  "IN_PROGRESS",
  "ACCEPTED",
  "REJECTED",
  "CANCELLED",
]);

export const adminRequests = pgTable(
  "admin_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    requestNumber: varchar("request_number", {
      length: 50,
    }).notNull(),

    adminId: uuid("admin_id")
      .notNull()
      .references(() => admins.id, {
        onDelete: "cascade",
      }),

    description: text("description").notNull(),

    internalNotes: text("internal_notes"),

    status: adminRequestStatusEnum("status").default("PENDING").notNull(),

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
    uniqueIndex("admin_requests_number_unique").on(table.requestNumber),

    index("admin_requests_admin_id_idx").on(table.adminId),

    index("admin_requests_status_idx").on(table.status),
  ],
);
