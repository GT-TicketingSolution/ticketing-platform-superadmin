-- admin_requests: add "state", remove "internal_notes".
-- Works on both possible database states:
--   * table missing (dropped manually) -> recreated with the final column order
--   * table present (older database)   -> "state" added, internal notes moved to note history, column dropped
DO $$
BEGIN
	IF to_regclass('public.admin_requests') IS NULL THEN
		CREATE TABLE "admin_requests" (
			"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
			"request_number" varchar(50) NOT NULL,
			"admin_id" uuid,
			"full_name" varchar(150),
			"email" varchar(255),
			"phone" varchar(20),
			"city" varchar(100),
			"state" varchar(100),
			"description" text NOT NULL,
			"status" "admin_request_status" DEFAULT 'PENDING' NOT NULL,
			"created_at" timestamp with time zone DEFAULT now() NOT NULL,
			"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
			CONSTRAINT "admin_requests_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action
		);
	ELSE
		ALTER TABLE "admin_requests" ADD COLUMN IF NOT EXISTS "state" varchar(100);

		IF EXISTS (
			SELECT 1 FROM information_schema.columns
			WHERE table_schema = 'public' AND table_name = 'admin_requests' AND column_name = 'internal_notes'
		) THEN
			-- Keep existing internal notes as note-history entries (attributed to the earliest platform admin).
			INSERT INTO "admin_request_notes" ("admin_request_id", "note", "created_by", "created_at")
			SELECT r."id", btrim(r."internal_notes"), pa."id", r."updated_at"
			FROM "admin_requests" r
			CROSS JOIN LATERAL (SELECT "id" FROM "platform_admin" ORDER BY "created_at" LIMIT 1) pa
			WHERE btrim(coalesce(r."internal_notes", '')) <> '';

			ALTER TABLE "admin_requests" DROP COLUMN "internal_notes";
		END IF;
	END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "admin_requests_number_unique" ON "admin_requests" USING btree ("request_number");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_requests_admin_id_idx" ON "admin_requests" USING btree ("admin_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_requests_status_idx" ON "admin_requests" USING btree ("status");
--> statement-breakpoint
-- Re-attach the foreign keys that a manual DROP TABLE ... CASCADE removes.
-- NOT VALID: rows left from before the drop are kept as-is; every new or updated row is checked.
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conrelid = 'public.admin_request_notes'::regclass AND confrelid = 'public.admin_requests'::regclass
	) THEN
		ALTER TABLE "admin_request_notes"
			ADD CONSTRAINT "admin_request_notes_request_fk" FOREIGN KEY ("admin_request_id")
			REFERENCES "public"."admin_requests"("id") ON DELETE cascade NOT VALID;
	END IF;

	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conrelid = 'public.notifications'::regclass AND confrelid = 'public.admin_requests'::regclass
	) THEN
		ALTER TABLE "notifications"
			ADD CONSTRAINT "notifications_request_id_admin_requests_id_fk" FOREIGN KEY ("request_id")
			REFERENCES "public"."admin_requests"("id") ON DELETE set null NOT VALID;
	END IF;
END $$;
