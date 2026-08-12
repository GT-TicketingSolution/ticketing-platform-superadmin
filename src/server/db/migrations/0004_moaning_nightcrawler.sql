ALTER TABLE "notifications" DROP CONSTRAINT "notifications_admin_id_admins_id_fk";
--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "admin_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;