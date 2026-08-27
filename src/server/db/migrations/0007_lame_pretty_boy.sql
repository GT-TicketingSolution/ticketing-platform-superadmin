CREATE TABLE "admin_request_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_request_id" uuid NOT NULL,
	"note" text NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "business_name" varchar(150) NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_request_notes" ADD CONSTRAINT "admin_request_notes_admin_request_id_admin_requests_id_fk" FOREIGN KEY ("admin_request_id") REFERENCES "public"."admin_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_request_notes" ADD CONSTRAINT "admin_request_notes_created_by_admins_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admins"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_request_notes_request_id_idx" ON "admin_request_notes" USING btree ("admin_request_id");--> statement-breakpoint
CREATE INDEX "admin_request_notes_created_by_idx" ON "admin_request_notes" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "admin_request_notes_created_at_idx" ON "admin_request_notes" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "renewals_one_pending_per_admin_idx" ON "renewals" USING btree ("admin_id") WHERE "renewals"."status" = 'PENDING';