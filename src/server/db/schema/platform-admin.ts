import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const platformAdmin = pgTable(
  "platform_admin",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: varchar("name", {
      length: 150,
    }).notNull(),

    email: varchar("email", {
      length: 255,
    }).notNull(),

    phone: varchar("phone", {
      length: 30,
    }).notNull(),

    passwordHash: varchar("password_hash", {
      length: 255,
    }).notNull(),

    lastLoginAt: timestamp("last_login_at", {
      withTimezone: true,
    }),

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
    uniqueIndex("platform_admin_email_unique").on(table.email),

    uniqueIndex("platform_admin_phone_unique").on(table.phone),
  ],
);
