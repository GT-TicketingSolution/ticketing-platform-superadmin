import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  timestamp,
  numeric,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const adminStatusEnum = pgEnum("admin_status", [
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
]);

export const admins = pgTable(
  "admins",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    fullName: varchar("full_name", {
      length: 150,
    }).notNull(),

    businessName: varchar("business_name", {
      length: 150,
    }).notNull(),

    phone: varchar("phone", {
      length: 30,
    }).notNull(),

    city: varchar("city", {
      length: 100,
    }).notNull(),

    email: varchar("email", {
      length: 255,
    }).notNull(),

    subdomain: varchar("subdomain", {
      length: 150,
    }),

    renewalAmount: numeric("renewal_amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    joinedAt: timestamp("joined_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    nextRenewalDate: timestamp("next_renewal_date", {
      withTimezone: true,
    }).notNull(),

    status: adminStatusEnum("status").default("ACTIVE").notNull(),

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
    uniqueIndex("admins_email_unique").on(table.email),

    uniqueIndex("admins_phone_unique").on(table.phone),

    uniqueIndex("admins_subdomain_unique").on(table.subdomain),

    index("admins_status_idx").on(table.status),

    index("admins_city_idx").on(table.city),

    index("admins_next_renewal_date_idx").on(table.nextRenewalDate),
  ],
);
