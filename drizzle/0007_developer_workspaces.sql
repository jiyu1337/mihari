CREATE TYPE "public"."developer_plan" AS ENUM('trial', 'builder', 'protocol');--> statement-breakpoint
CREATE TYPE "public"."developer_access_status" AS ENUM('trial', 'contact_requested', 'active', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."developer_request_status" AS ENUM('submitted', 'reviewing', 'approved', 'declined');--> statement-breakpoint
CREATE TABLE "developer_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"name" text NOT NULL,
	"plan" "developer_plan" DEFAULT 'trial' NOT NULL,
	"status" "developer_access_status" DEFAULT 'trial' NOT NULL,
	"monthly_request_limit" integer DEFAULT 2500 NOT NULL,
	"cycle_started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "developer_api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"integration_id" uuid NOT NULL,
	"label" text NOT NULL,
	"prefix" text NOT NULL,
	"secret_hash" text NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "developer_api_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"api_key_id" uuid NOT NULL,
	"integration_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"method" text NOT NULL,
	"status_code" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "developer_access_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"integration_id" uuid,
	"requested_plan" "developer_plan" NOT NULL,
	"project_name" text NOT NULL,
	"contact_email" text NOT NULL,
	"expected_monthly_requests" integer NOT NULL,
	"use_case" text NOT NULL,
	"status" "developer_request_status" DEFAULT 'submitted' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "developer_integrations" ADD CONSTRAINT "developer_integrations_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "developer_api_keys" ADD CONSTRAINT "developer_api_keys_integration_id_developer_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."developer_integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "developer_api_usage" ADD CONSTRAINT "developer_api_usage_api_key_id_developer_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."developer_api_keys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "developer_api_usage" ADD CONSTRAINT "developer_api_usage_integration_id_developer_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."developer_integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "developer_access_requests" ADD CONSTRAINT "developer_access_requests_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "developer_access_requests" ADD CONSTRAINT "developer_access_requests_integration_id_developer_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."developer_integrations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "developer_integrations_account_created_idx" ON "developer_integrations" USING btree ("account_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "developer_api_keys_secret_hash_idx" ON "developer_api_keys" USING btree ("secret_hash");--> statement-breakpoint
CREATE INDEX "developer_api_keys_integration_created_idx" ON "developer_api_keys" USING btree ("integration_id","created_at");--> statement-breakpoint
CREATE INDEX "developer_api_usage_key_created_idx" ON "developer_api_usage" USING btree ("api_key_id","created_at");--> statement-breakpoint
CREATE INDEX "developer_api_usage_integration_created_idx" ON "developer_api_usage" USING btree ("integration_id","created_at");--> statement-breakpoint
CREATE INDEX "developer_access_requests_account_created_idx" ON "developer_access_requests" USING btree ("account_id","created_at");
