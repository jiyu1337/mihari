CREATE TYPE "public"."event_severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('detected', 'reviewed', 'actioned', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."policy_mode" AS ENUM('observe', 'guard', 'automate');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"corporate_action_id" uuid NOT NULL,
	"model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"output" jsonb NOT NULL,
	"confidence" integer NOT NULL,
	"input_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corporate_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" text,
	"symbol" text NOT NULL,
	"type" text NOT NULL,
	"status" "event_status" DEFAULT 'detected' NOT NULL,
	"severity" "event_severity" DEFAULT 'medium' NOT NULL,
	"effective_at" timestamp with time zone,
	"source_payload" jsonb NOT NULL,
	"source_hash" text NOT NULL,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"corporate_action_id" uuid NOT NULL,
	"wallet_id" uuid,
	"policy" text NOT NULL,
	"decision" text NOT NULL,
	"chain_id" integer DEFAULT 4663 NOT NULL,
	"transaction_hash" text,
	"attestation_hash" text,
	"executed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid,
	"address" text NOT NULL,
	"chain_id" integer DEFAULT 4663 NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watchlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid,
	"anonymous_id" text,
	"symbols" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"mode" "policy_mode" DEFAULT 'observe' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_corporate_action_id_corporate_actions_id_fk" FOREIGN KEY ("corporate_action_id") REFERENCES "public"."corporate_actions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_receipts" ADD CONSTRAINT "policy_receipts_corporate_action_id_corporate_actions_id_fk" FOREIGN KEY ("corporate_action_id") REFERENCES "public"."corporate_actions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_receipts" ADD CONSTRAINT "policy_receipts_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "corporate_action_source_hash_idx" ON "corporate_actions" USING btree ("source_hash");--> statement-breakpoint
CREATE INDEX "corporate_action_symbol_detected_idx" ON "corporate_actions" USING btree ("symbol","detected_at");--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_chain_address_idx" ON "wallets" USING btree ("chain_id","address");