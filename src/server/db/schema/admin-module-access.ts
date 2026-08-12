import {
  pgTable,
  uuid,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

import { admins } from "./admins";
import { modules } from "./modules";

export const adminModuleAccess = pgTable(
  "admin_module_access",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    adminId: uuid("admin_id")
      .notNull()
      .references(() => admins.id, {
        onDelete: "cascade",
      }),

    moduleId: uuid("module_id")
      .notNull()
      .references(() => modules.id, {
        onDelete: "cascade",
      }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    uniqueIndex("admin_module_access_unique").on(table.adminId, table.moduleId),

    index("admin_module_access_admin_idx").on(table.adminId),

    index("admin_module_access_module_idx").on(table.moduleId),
  ],
);
