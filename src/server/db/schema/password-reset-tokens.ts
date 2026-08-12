import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

import { platformAdmin } from "./platform-admin";

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
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

    usedAt: timestamp("used_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    uniqueIndex("password_reset_token_hash_unique").on(table.tokenHash),

    index("password_reset_admin_idx").on(table.platformAdminId),

    index("password_reset_expires_idx").on(table.expiresAt),
  ],
);
