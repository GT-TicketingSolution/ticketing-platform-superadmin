import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

import { platformAdmin } from "./platform-admin";

export const auditActionEnum = pgEnum("audit_action", [
  "CREATE",
  "UPDATE",
  "DELETE",
  "APPROVE",
  "REJECT",
  "LOGIN",
  "LOGOUT",
  "PASSWORD_RESET",
  "STATUS_CHANGE",
  "NOTIFICATION_SENT",
]);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    actorId: uuid("actor_id")
      .notNull()
      .references(() => platformAdmin.id, {
        onDelete: "restrict",
      }),

    action: auditActionEnum("action").notNull(),

    resourceType: varchar("resource_type", {
      length: 100,
    }).notNull(),

    resourceId: uuid("resource_id"),

    oldValues: jsonb("old_values"),

    newValues: jsonb("new_values"),

    ipAddress: varchar("ip_address", {
      length: 45,
    }),

    userAgent: text("user_agent"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    index("audit_logs_actor_id_idx").on(table.actorId),

    index("audit_logs_resource_idx").on(table.resourceType, table.resourceId),

    index("audit_logs_created_at_idx").on(table.createdAt),
  ],
);
