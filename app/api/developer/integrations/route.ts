import { and, desc, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { getDatabase, getDatabaseUrl } from "@/db/client";
import { developerAccessRequests, developerApiKeys, developerApiUsage, developerIntegrations } from "@/db/schema";
import { getAuthenticatedAccount } from "@/lib/account";
import { createApiKeyMaterial, DEVELOPER_PLANS } from "@/lib/developer-access";

export const runtime = "nodejs";

const createSchema = z.object({ name: z.string().trim().min(2).max(80).default("My MIHARI integration") });

function unavailable() {
  return Response.json({ error: "Developer workspace storage is not configured" }, { status: 503 });
}

async function accountContext() {
  const account = await getAuthenticatedAccount();
  if (!account) return { response: Response.json({ error: "Sign in to open your developer workspace" }, { status: 401 }) };
  if (!getDatabaseUrl()) return { response: unavailable() };
  return { account, database: getDatabase() };
}

export async function GET() {
  const context = await accountContext();
  if (context.response) return context.response;
  const { account, database } = context;
  const integrations = await database.select().from(developerIntegrations).where(eq(developerIntegrations.accountId, account.id)).orderBy(desc(developerIntegrations.createdAt));
  const result = await Promise.all(integrations.map(async (integration) => {
    const [usage] = await database.select({ count: sql<number>`count(*)::int` }).from(developerApiUsage).where(and(
      eq(developerApiUsage.integrationId, integration.id),
      gte(developerApiUsage.createdAt, integration.cycleStartedAt),
    ));
    const keys = await database.select({ id: developerApiKeys.id, label: developerApiKeys.label, prefix: developerApiKeys.prefix, lastUsedAt: developerApiKeys.lastUsedAt, revokedAt: developerApiKeys.revokedAt, createdAt: developerApiKeys.createdAt }).from(developerApiKeys).where(eq(developerApiKeys.integrationId, integration.id)).orderBy(desc(developerApiKeys.createdAt));
    const [request] = await database.select({ status: developerAccessRequests.status, requestedPlan: developerAccessRequests.requestedPlan, createdAt: developerAccessRequests.createdAt }).from(developerAccessRequests).where(eq(developerAccessRequests.integrationId, integration.id)).orderBy(desc(developerAccessRequests.createdAt)).limit(1);
    return { ...integration, used: usage?.count ?? 0, keys, request: request ?? null };
  }));
  return Response.json({ plans: DEVELOPER_PLANS, integrations: result }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  try {
    const context = await accountContext();
    if (context.response) return context.response;
    const { account, database } = context;
    const parsed = createSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return Response.json({ error: "Choose a short integration name" }, { status: 400 });

    const [existing] = await database.select().from(developerIntegrations).where(eq(developerIntegrations.accountId, account.id)).limit(1);
    const integration = existing ?? (await database.insert(developerIntegrations)
      .values({ accountId: account.id, name: parsed.data.name, monthlyRequestLimit: DEVELOPER_PLANS.trial.limit })
      .returning())[0];
    if (!integration) return Response.json({ error: "Could not create developer workspace" }, { status: 500 });

    const [existingKey] = await database.select({ id: developerApiKeys.id })
      .from(developerApiKeys)
      .where(eq(developerApiKeys.integrationId, integration.id))
      .limit(1);
    if (existingKey) return Response.json({ error: "This account already has a developer workspace. Create an additional key from the key panel." }, { status: 409 });

    const key = createApiKeyMaterial();
    const [createdKey] = await database.insert(developerApiKeys)
      .values({ integrationId: integration.id, label: "Default key", prefix: key.prefix, secretHash: key.secretHash })
      .returning({ id: developerApiKeys.id });
    return Response.json({ integration: { ...integration, used: 0, keys: [{ id: createdKey?.id, label: "Default key", prefix: key.prefix, revokedAt: null, lastUsedAt: null, createdAt: new Date() }] }, secret: key.secret }, { status: existing ? 200 : 201 });
  } catch (error) {
    console.error("[developer-workspace] create failed", error);
    return Response.json({ error: "Developer workspace could not be created. No API key was issued. Please reload and try again." }, { status: 500 });
  }
}
