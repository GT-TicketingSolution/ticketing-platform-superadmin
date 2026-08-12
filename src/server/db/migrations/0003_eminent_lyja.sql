CREATE TYPE "public"."notification_status" AS ENUM('OVERDUE', 'DUE_SOON', 'NEW', 'INFO');--> statement-breakpoint
CREATE TABLE "platform_admin" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(30) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cities" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "businesses" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "renewal_payments" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "request_status_history" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "platform_users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "roles" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "permissions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_roles" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "role_permissions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "cities" CASCADE;--> statement-breakpoint
DROP TABLE "businesses" CASCADE;--> statement-breakpoint
DROP TABLE "renewal_payments" CASCADE;--> statement-breakpoint
DROP TABLE "request_status_history" CASCADE;--> statement-breakpoint
DROP TABLE "platform_users" CASCADE;--> statement-breakpoint
DROP TABLE "roles" CASCADE;--> statement-breakpoint
DROP TABLE "permissions" CASCADE;--> statement-breakpoint
DROP TABLE "user_roles" CASCADE;--> statement-breakpoint
DROP TABLE "role_permissions" CASCADE;--> statement-breakpoint
ALTER TABLE "admin_requests" DROP CONSTRAINT "admin_requests_request_number_unique";--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_token_hash_unique";--> statement-breakpoint
ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "password_reset_tokens_token_hash_unique";--> statement-breakpoint
ALTER TABLE "admins" DROP CONSTRAINT "admins_business_id_businesses_id_fk";
--> statement-breakpoint
ALTER TABLE "admin_module_access" DROP CONSTRAINT "admin_module_access_granted_by_platform_users_id_fk";
--> statement-breakpoint
ALTER TABLE "renewals" DROP CONSTRAINT "renewals_business_id_businesses_id_fk";
--> statement-breakpoint
ALTER TABLE "admin_requests" DROP CONSTRAINT "admin_requests_business_id_businesses_id_fk";
--> statement-breakpoint
ALTER TABLE "admin_requests" DROP CONSTRAINT "admin_requests_created_by_platform_users_id_fk";
--> statement-breakpoint
ALTER TABLE "admin_requests" DROP CONSTRAINT "admin_requests_assigned_to_platform_users_id_fk";
--> statement-breakpoint
ALTER TABLE "admin_requests" DROP CONSTRAINT "admin_requests_admin_id_admins_id_fk";
--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_recipient_id_platform_users_id_fk";
--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_business_id_businesses_id_fk";
--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_user_id_platform_users_id_fk";
--> statement-breakpoint
ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "password_reset_tokens_user_id_platform_users_id_fk";
--> statement-breakpoint
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_actor_id_platform_users_id_fk";
--> statement-breakpoint
DROP INDEX "notifications_recipient_idx";--> statement-breakpoint
DROP INDEX "notifications_read_idx";--> statement-breakpoint
DROP INDEX "sessions_user_id_idx";--> statement-breakpoint
DROP INDEX "password_reset_tokens_user_idx";--> statement-breakpoint
DROP INDEX "audit_logs_actor_idx";--> statement-breakpoint
ALTER TABLE "admin_module_access" DROP CONSTRAINT "admin_module_access_admin_id_module_id_pk";--> statement-breakpoint
ALTER TABLE "admin_requests" ALTER COLUMN "request_number" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "admin_requests" ALTER COLUMN "admin_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "actor_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "city" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "subdomain" varchar(150);--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "renewal_amount" numeric(12, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "next_renewal_date" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "modules" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_module_access" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_module_access" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "renewals" ADD COLUMN "admin_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "renewals" ADD COLUMN "start_date" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "renewals" ADD COLUMN "due_date" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "renewals" ADD COLUMN "payment_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "renewals" ADD COLUMN "payment_method" "payment_method";--> statement-breakpoint
ALTER TABLE "renewals" ADD COLUMN "transaction_reference" varchar(255);--> statement-breakpoint
ALTER TABLE "renewals" ADD COLUMN "payment_status" "payment_status";--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "status" "notification_status" DEFAULT 'NEW' NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "platform_admin_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD COLUMN "platform_admin_id" uuid NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "platform_admin_email_unique" ON "platform_admin" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_admin_phone_unique" ON "platform_admin" USING btree ("phone");--> statement-breakpoint
ALTER TABLE "renewals" ADD CONSTRAINT "renewals_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_requests" ADD CONSTRAINT "admin_requests_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_platform_admin_id_platform_admin_id_fk" FOREIGN KEY ("platform_admin_id") REFERENCES "public"."platform_admin"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_platform_admin_id_platform_admin_id_fk" FOREIGN KEY ("platform_admin_id") REFERENCES "public"."platform_admin"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_platform_admin_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."platform_admin"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admins_phone_unique" ON "admins" USING btree ("phone");--> statement-breakpoint
CREATE UNIQUE INDEX "admins_subdomain_unique" ON "admins" USING btree ("subdomain");--> statement-breakpoint
CREATE INDEX "admins_status_idx" ON "admins" USING btree ("status");--> statement-breakpoint
CREATE INDEX "admins_city_idx" ON "admins" USING btree ("city");--> statement-breakpoint
CREATE INDEX "admins_next_renewal_date_idx" ON "admins" USING btree ("next_renewal_date");--> statement-breakpoint
CREATE INDEX "modules_active_idx" ON "modules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "modules_sort_order_idx" ON "modules" USING btree ("sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_module_access_unique" ON "admin_module_access" USING btree ("admin_id","module_id");--> statement-breakpoint
CREATE INDEX "admin_module_access_admin_idx" ON "admin_module_access" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "admin_module_access_module_idx" ON "admin_module_access" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "renewals_admin_id_idx" ON "renewals" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "renewals_status_idx" ON "renewals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "renewals_due_date_idx" ON "renewals" USING btree ("due_date");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_requests_number_unique" ON "admin_requests" USING btree ("request_number");--> statement-breakpoint
CREATE INDEX "admin_requests_admin_id_idx" ON "admin_requests" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "admin_requests_status_idx" ON "admin_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notifications_type_idx" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notifications_priority_idx" ON "notifications" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "notifications_status_idx" ON "notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notifications_is_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "notifications_admin_id_idx" ON "notifications" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "notifications_renewal_id_idx" ON "notifications" USING btree ("renewal_id");--> statement-breakpoint
CREATE INDEX "notifications_request_id_idx" ON "notifications" USING btree ("request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_hash_unique" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "sessions_platform_admin_idx" ON "sessions" USING btree ("platform_admin_id");--> statement-breakpoint
CREATE UNIQUE INDEX "password_reset_token_hash_unique" ON "password_reset_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "password_reset_admin_idx" ON "password_reset_tokens" USING btree ("platform_admin_id");--> statement-breakpoint
CREATE INDEX "password_reset_expires_idx" ON "password_reset_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
ALTER TABLE "admins" DROP COLUMN "business_id";--> statement-breakpoint
ALTER TABLE "admin_module_access" DROP COLUMN "granted_by";--> statement-breakpoint
ALTER TABLE "admin_module_access" DROP COLUMN "granted_at";--> statement-breakpoint
ALTER TABLE "renewals" DROP COLUMN "business_id";--> statement-breakpoint
ALTER TABLE "renewals" DROP COLUMN "renewal_date";--> statement-breakpoint
ALTER TABLE "admin_requests" DROP COLUMN "business_id";--> statement-breakpoint
ALTER TABLE "admin_requests" DROP COLUMN "admin_name";--> statement-breakpoint
ALTER TABLE "admin_requests" DROP COLUMN "phone";--> statement-breakpoint
ALTER TABLE "admin_requests" DROP COLUMN "email";--> statement-breakpoint
ALTER TABLE "admin_requests" DROP COLUMN "created_by";--> statement-breakpoint
ALTER TABLE "admin_requests" DROP COLUMN "assigned_to";--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "recipient_id";--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "business_id";--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "password_reset_tokens" DROP COLUMN "user_id";--> statement-breakpoint
DROP TYPE "public"."business_status";--> statement-breakpoint
DROP TYPE "public"."platform_user_status";