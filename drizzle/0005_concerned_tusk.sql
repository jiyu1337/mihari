CREATE TYPE "public"."guard_action_status" AS ENUM('draft', 'approved', 'dismissed');--> statement-breakpoint
CREATE TABLE "guard_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"corporate_action_id" uuid NOT NULL,
	"source_event_id" text NOT NULL,
	"source_hash" text NOT NULL,
	"symbol" text NOT NULL,
	"intent" text NOT NULL,
	"preview" jsonb NOT NULL,
	"status" "guard_action_status" DEFAULT 'draft' NOT NULL,
	"approval_note" text,
	"decision_hash" text,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "guard_actions" ADD CONSTRAINT "guard_actions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guard_actions" ADD CONSTRAINT "guard_actions_corporate_action_id_corporate_actions_id_fk" FOREIGN KEY ("corporate_action_id") REFERENCES "public"."corporate_actions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "guard_actions_account_source_intent_idx" ON "guard_actions" USING btree ("account_id","source_hash","intent");--> statement-breakpoint
CREATE INDEX "guard_actions_account_created_idx" ON "guard_actions" USING btree ("account_id","created_at");