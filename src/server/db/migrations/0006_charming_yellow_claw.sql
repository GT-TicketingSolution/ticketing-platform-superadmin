ALTER TABLE "admin_requests" DROP CONSTRAINT "admin_requests_admin_id_admins_id_fk";
--> statement-breakpoint
ALTER TABLE "admin_requests" ALTER COLUMN "admin_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_requests" ADD COLUMN "full_name" varchar(150);--> statement-breakpoint
ALTER TABLE "admin_requests" ADD COLUMN "phone" varchar(20);--> statement-breakpoint
ALTER TABLE "admin_requests" ADD COLUMN "email" varchar(255);--> statement-breakpoint
ALTER TABLE "admin_requests" ADD COLUMN "city" varchar(100);--> statement-breakpoint
ALTER TABLE "admin_requests" ADD CONSTRAINT "admin_requests_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;