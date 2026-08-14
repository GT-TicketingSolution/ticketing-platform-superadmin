CREATE TYPE "public"."renewal_notification_status" AS ENUM('SENT', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."renewal_notification_type" AS ENUM('RENEWAL_REMINDER');--> statement-breakpoint
CREATE TABLE "renewal_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"renewal_id" uuid NOT NULL,
	"admin_id" uuid NOT NULL,
	"type" "renewal_notification_type" DEFAULT 'RENEWAL_REMINDER' NOT NULL,
	"channel" varchar(20) DEFAULT 'EMAIL' NOT NULL,
	"status" "renewal_notification_status" DEFAULT 'SENT' NOT NULL,
	"recipient_email" varchar(255) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"sent_at" timestamp with time zone,
	"error_message" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_admin_id_admins_id_fk";
--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "admin_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "platform_admin_id" uuid;--> statement-breakpoint
ALTER TABLE "renewal_notifications" ADD CONSTRAINT "renewal_notifications_renewal_id_renewals_id_fk" FOREIGN KEY ("renewal_id") REFERENCES "public"."renewals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "renewal_notifications" ADD CONSTRAINT "renewal_notifications_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "renewal_notifications_renewal_id_idx" ON "renewal_notifications" USING btree ("renewal_id");--> statement-breakpoint
CREATE INDEX "renewal_notifications_admin_id_idx" ON "renewal_notifications" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "renewal_notifications_status_idx" ON "renewal_notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "renewal_notifications_sent_at_idx" ON "renewal_notifications" USING btree ("sent_at");--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_platform_admin_id_platform_admin_id_fk" FOREIGN KEY ("platform_admin_id") REFERENCES "public"."platform_admin"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_platform_admin_id_idx" ON "notifications" USING btree ("platform_admin_id");