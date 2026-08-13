import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const eventSeverity = pgEnum("event_severity", ["low", "medium", "high", "critical"]);
export const policyMode = pgEnum("policy_mode", ["observe", "guard", "automate"]);
export const eventStatus = pgEnum("event_status", ["detected", "reviewed", "actioned", "resolved"]);

export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  authProviderId: text("auth_provider_id").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("accounts_auth_provider_id_idx").on(table.authProviderId)]);

export const wallets = pgTable("wallets", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id").references(() => accounts.id, { onDelete: "cascade" }),
  address: text("address").notNull(),
  chainId: integer("chain_id").default(4663).notNull(),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("wallet_chain_address_idx").on(table.chainId, table.address)]);

export const walletChallenges = pgTable("wallet_challenges", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id").references(() => accounts.id, { onDelete: "cascade" }).notNull(),
  address: text("address").notNull(),
  nonce: text("nonce").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("wallet_challenges_nonce_idx").on(table.nonce)]);

export const watchlists = pgTable("watchlists", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id").references(() => accounts.id, { onDelete: "cascade" }),
  anonymousId: text("anonymous_id"),
  symbols: jsonb("symbols").$type<string[]>().default([]).notNull(),
  mode: policyMode("mode").default("observe").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("watchlists_account_id_idx").on(table.accountId)]);

export const corporateActions = pgTable("corporate_actions", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceId: text("source_id"),
  symbol: text("symbol").notNull(),
  type: text("type").notNull(),
  status: eventStatus("status").default("detected").notNull(),
  severity: eventSeverity("severity").default("medium").notNull(),
  effectiveAt: timestamp("effective_at", { withTimezone: true }),
  sourcePayload: jsonb("source_payload").$type<Record<string, unknown>>().notNull(),
  sourceHash: text("source_hash").notNull(),
  detectedAt: timestamp("detected_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("corporate_action_source_hash_idx").on(table.sourceHash),
  index("corporate_action_symbol_detected_idx").on(table.symbol, table.detectedAt),
]);

export const analyses = pgTable("analyses", {
  id: uuid("id").defaultRandom().primaryKey(),
  corporateActionId: uuid("corporate_action_id").references(() => corporateActions.id, { onDelete: "cascade" }).notNull(),
  model: text("model").notNull(),
  promptVersion: text("prompt_version").notNull(),
  output: jsonb("output").$type<Record<string, unknown>>().notNull(),
  confidence: integer("confidence").notNull(),
  inputHash: text("input_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("analyses_input_hash_idx").on(table.inputHash)]);

export const policyReceipts = pgTable("policy_receipts", {
  id: uuid("id").defaultRandom().primaryKey(),
  corporateActionId: uuid("corporate_action_id").references(() => corporateActions.id, { onDelete: "restrict" }).notNull(),
  walletId: uuid("wallet_id").references(() => wallets.id, { onDelete: "set null" }),
  policy: text("policy").notNull(),
  decision: text("decision").notNull(),
  chainId: integer("chain_id").default(4663).notNull(),
  transactionHash: text("transaction_hash"),
  attestationHash: text("attestation_hash"),
  executedAt: timestamp("executed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
