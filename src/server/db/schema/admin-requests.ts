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
import { platformAdmin } from "./platform-admin";

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

    /*
     * Nullable because the first Admin request can exist
     * before an Admin record has been created.
     */
    adminId: uuid("admin_id").references(() => admins.id, {
      onDelete: "set null",
    }),

    /*
     * Proposed Admin details.
     * These are required for a first Admin request,
     * where adminId is NULL.
     */
    fullName: varchar("full_name", {
      length: 150,
    }),

    phone: varchar("phone", {
      length: 20,
    }),

    email: varchar("email", {
      length: 255,
    }),

    city: varchar("city", {
      length: 100,
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

export const adminRequestNotes = pgTable(
  "admin_request_notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    adminRequestId: uuid("admin_request_id")
      .notNull()
      .references(() => adminRequests.id, {
        onDelete: "cascade",
      }),

    note: text("note").notNull(),

    createdBy: uuid("created_by")
      .notNull()
      .references(() => platformAdmin.id),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("admin_request_notes_request_id_idx").on(table.adminRequestId),
    index("admin_request_notes_created_by_idx").on(table.createdBy),
    index("admin_request_notes_created_at_idx").on(table.createdAt),
  ],
);
