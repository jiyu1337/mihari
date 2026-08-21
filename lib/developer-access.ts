import { createHash, randomBytes } from "node:crypto";
import { and, eq, gte, isNull, sql } from "drizzle-orm";
import { getDatabase, getDatabaseUrl } from "@/db/client";
import { developerApiKeys, developerApiUsage, developerIntegrations } from "@/db/schema";

export const DEVELOPER_PLANS = {
  trial: { label: "Trial", limit: 2500, description: "For testing public MIHARI intelligence with a private usage record." },
  builder: { label: "Builder", limit: 50000, description: "For production apps, agents and recurring monitoring." },
  protocol: { label: "Protocol", limit: 250000, description: "For protocol integrations, signed webhooks and higher-volume infrastructure." },
} as const;

export type DeveloperPlan = keyof typeof DEVELOPER_PLANS;

function hashSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

function startOfCycle(cycleStartedAt: Date) {
  return cycleStartedAt;
}

export function createApiKeyMaterial() {
  const secret = `mhr_live_${randomBytes(30).toString("base64url")}`;
  return { secret, prefix: secret.slice(0, 16), secretHash: hashSecret(secret) };
}

export function readSuppliedApiKey(request: Request) {
  const explicit = request.headers.get("x-mihari-api-key")?.trim();
  if (explicit) return explicit;
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")?.trim();
  return bearer?.startsWith("mhr_live_") ? bearer : null;
}

export type DeveloperApiAccess =
  | { mode: "public" }
  | { mode: "key"; apiKeyId: string; integrationId: string; plan: DeveloperPlan; limit: number; used: number }
  | { mode: "denied"; message: string; status: 401 | 403 | 429 | 503 };

export async function resolveDeveloperApiAccess(request: Request): Promise<DeveloperApiAccess> {
  const supplied = readSuppliedApiKey(request);
  if (!supplied) return { mode: "public" };
  if (!getDatabaseUrl()) return { mode: "denied", status: 503, message: "Developer API key storage is not configured" };

  const database = getDatabase();
  const [row] = await database
    .select({
      keyId: developerApiKeys.id,
      integrationId: developerIntegrations.id,
      plan: developerIntegrations.plan,
      status: developerIntegrations.status,
      limit: developerIntegrations.monthlyRequestLimit,
      cycleStartedAt: developerIntegrations.cycleStartedAt,
    })
    .from(developerApiKeys)
    .innerJoin(developerIntegrations, eq(developerApiKeys.integrationId, developerIntegrations.id))
    .where(and(eq(developerApiKeys.secretHash, hashSecret(supplied)), isNull(developerApiKeys.revokedAt)))
    .limit(1);

  if (!row) return { mode: "denied", status: 401, message: "MIHARI API key is invalid or revoked" };
  if (row.status === "suspended") return { mode: "denied", status: 403, message: "This MIHARI integration is suspended" };

  const [{ count }] = await database
    .select({ count: sql<number>`count(*)::int` })
    .from(developerApiUsage)
    .where(and(
      eq(developerApiUsage.integrationId, row.integrationId),
      gte(developerApiUsage.createdAt, startOfCycle(row.cycleStartedAt)),
    ));

  if (count >= row.limit) return { mode: "denied", status: 429, message: "This integration has reached its current request limit. Contact the MIHARI team to increase capacity." };

  return {
    mode: "key",
    apiKeyId: row.keyId,
    integrationId: row.integrationId,
    plan: row.plan as DeveloperPlan,
    limit: row.limit,
    used: count,
  };
}

export async function recordDeveloperApiUsage(access: DeveloperApiAccess, endpoint: string, method: string, statusCode: number) {
  if (access.mode !== "key" || !getDatabaseUrl()) return;
  const database = getDatabase();
  await Promise.all([
    database.insert(developerApiUsage).values({
      apiKeyId: access.apiKeyId,
      integrationId: access.integrationId,
      endpoint,
      method,
      statusCode,
    }),
    database.update(developerApiKeys).set({ lastUsedAt: new Date() }).where(eq(developerApiKeys.id, access.apiKeyId)),
  ]);
}
