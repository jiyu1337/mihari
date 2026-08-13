CREATE TABLE "wallet_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"address" text NOT NULL,
	"nonce" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "auth_provider_id" text;--> statement-breakpoint
UPDATE "accounts" SET "auth_provider_id" = 'legacy:' || "id"::text WHERE "auth_provider_id" IS NULL;--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "auth_provider_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "wallet_challenges" ADD CONSTRAINT "wallet_challenges_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_challenges_nonce_idx" ON "wallet_challenges" USING btree ("nonce");--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_auth_provider_id_idx" ON "accounts" USING btree ("auth_provider_id");--> statement-breakpoint
CREATE UNIQUE INDEX "watchlists_account_id_idx" ON "watchlists" USING btree ("account_id");
