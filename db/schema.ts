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
export const guardActionStatus = pgEnum("guard_action_status", ["draft", "approved", "dismissed"]);
export const webhookDeliveryStatus = pgEnum("webhook_delivery_status", ["pending", "delivered", "failed"]);
export const developerPlan = pgEnum("developer_plan", ["trial", "builder", "protocol"]);
export const developerAccessStatus = pgEnum("developer_access_status", ["trial", "contact_requested", "active", "suspended"]);
export const developerRequestStatus = pgEnum("developer_request_status", ["submitted", "reviewing", "approved", "declined"]);

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

export const walletLoginChallenges = pgTable("wallet_login_challenges", {
  id: uuid("id").defaultRandom().primaryKey(),
  address: text("address").notNull(),
  nonce: text("nonce").notNull(),
  message: text("message").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("wallet_login_challenges_nonce_idx").on(table.nonce)]);

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
  accountId: uuid("account_id").references(() => accounts.id, { onDelete: "set null" }),
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

export const guardActions = pgTable("guard_actions", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id").references(() => accounts.id, { onDelete: "cascade" }).notNull(),
  corporateActionId: uuid("corporate_action_id").references(() => corporateActions.id, { onDelete: "restrict" }).notNull(),
  sourceEventId: text("source_event_id").notNull(),
  sourceHash: text("source_hash").notNull(),
  symbol: text("symbol").notNull(),
  intent: text("intent").notNull(),
  preview: jsonb("preview").$type<Record<string, unknown>>().notNull(),
  status: guardActionStatus("status").default("draft").notNull(),
  approvalNote: text("approval_note"),
  decisionHash: text("decision_hash"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("guard_actions_account_source_intent_idx").on(table.accountId, table.sourceHash, table.intent),
  index("guard_actions_account_created_idx").on(table.accountId, table.createdAt),
]);

// Integration-owned records. These never reference MIHARI accounts, wallets or positions.
export const apiWebhookSubscriptions = pgTable("api_webhook_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  label: text("label").notNull(),
  url: text("url").notNull(),
  secret: text("secret").notNull(),
  eventTypes: jsonb("event_types").$type<string[]>().default([]).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const apiWebhookDeliveries = pgTable("api_webhook_deliveries", {
  id: uuid("id").defaultRandom().primaryKey(),
  subscriptionId: uuid("subscription_id").references(() => apiWebhookSubscriptions.id, { onDelete: "cascade" }).notNull(),
  eventType: text("event_type").notNull(),
  fingerprint: text("fingerprint").notNull(),
  status: webhookDeliveryStatus("status").default("pending").notNull(),
  responseStatus: integer("response_status"),
  error: text("error"),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("api_webhook_delivery_subscription_fingerprint_idx").on(table.subscriptionId, table.fingerprint),
  index("api_webhook_delivery_subscription_created_idx").on(table.subscriptionId, table.createdAt),
]);

// Developer API access is owned by an authenticated MIHARI account. Key material is never stored,
// only a one-way hash and a non-sensitive prefix that can be shown back to the account owner.
export const developerIntegrations = pgTable("developer_integrations", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id").references(() => accounts.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  plan: developerPlan("plan").default("trial").notNull(),
  status: developerAccessStatus("status").default("trial").notNull(),
  monthlyRequestLimit: integer("monthly_request_limit").default(2500).notNull(),
  cycleStartedAt: timestamp("cycle_started_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("developer_integrations_account_created_idx").on(table.accountId, table.createdAt),
]);

export const developerApiKeys = pgTable("developer_api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  integrationId: uuid("integration_id").references(() => developerIntegrations.id, { onDelete: "cascade" }).notNull(),
  label: text("label").notNull(),
  prefix: text("prefix").notNull(),
  secretHash: text("secret_hash").notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("developer_api_keys_secret_hash_idx").on(table.secretHash),
  index("developer_api_keys_integration_created_idx").on(table.integrationId, table.createdAt),
]);

export const developerApiUsage = pgTable("developer_api_usage", {
  id: uuid("id").defaultRandom().primaryKey(),
  apiKeyId: uuid("api_key_id").references(() => developerApiKeys.id, { onDelete: "cascade" }).notNull(),
  integrationId: uuid("integration_id").references(() => developerIntegrations.id, { onDelete: "cascade" }).notNull(),
  endpoint: text("endpoint").notNull(),
  method: text("method").notNull(),
  statusCode: integer("status_code").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("developer_api_usage_key_created_idx").on(table.apiKeyId, table.createdAt),
  index("developer_api_usage_integration_created_idx").on(table.integrationId, table.createdAt),
]);

export const developerAccessRequests = pgTable("developer_access_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id").references(() => accounts.id, { onDelete: "cascade" }).notNull(),
  integrationId: uuid("integration_id").references(() => developerIntegrations.id, { onDelete: "set null" }),
  requestedPlan: developerPlan("requested_plan").notNull(),
  projectName: text("project_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  expectedMonthlyRequests: integer("expected_monthly_requests").notNull(),
  useCase: text("use_case").notNull(),
  status: developerRequestStatus("status").default("submitted").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("developer_access_requests_account_created_idx").on(table.accountId, table.createdAt),
]);
