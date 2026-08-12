import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

import { platformAdmin } from "./platform-admin";

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    platformAdminId: uuid("platform_admin_id")
      .notNull()
      .references(() => platformAdmin.id, {
        onDelete: "cascade",
      }),

    tokenHash: varchar("token_hash", {
      length: 255,
    }).notNull(),

    expiresAt: timestamp("expires_at", {
      withTimezone: true,
    }).notNull(),

    lastUsedAt: timestamp("last_used_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    uniqueIndex("sessions_token_hash_unique").on(table.tokenHash),

    index("sessions_platform_admin_idx").on(table.platformAdminId),

    index("sessions_expires_at_idx").on(table.expiresAt),
  ],
);
