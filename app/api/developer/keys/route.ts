import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDatabase, getDatabaseUrl } from "@/db/client";
import { developerApiKeys, developerIntegrations } from "@/db/schema";
import { getAuthenticatedAccount } from "@/lib/account";
import { createApiKeyMaterial } from "@/lib/developer-access";

export const runtime = "nodejs";
const keySchema = z.object({ integrationId: z.string().uuid(), label: z.string().trim().min(2).max(80) });

export async function POST(request: Request) {
  const account = await getAuthenticatedAccount();
  if (!account) return Response.json({ error: "Sign in required" }, { status: 401 });
  if (!getDatabaseUrl()) return Response.json({ error: "Developer workspace storage is not configured" }, { status: 503 });
  const parsed = keySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "A valid integration and key label are required" }, { status: 400 });
  const database = getDatabase();
  const [integration] = await database.select({ id: developerIntegrations.id }).from(developerIntegrations).where(and(eq(developerIntegrations.id, parsed.data.integrationId), eq(developerIntegrations.accountId, account.id))).limit(1);
  if (!integration) return Response.json({ error: "Integration not found" }, { status: 404 });
  const material = createApiKeyMaterial();
  const [created] = await database.insert(developerApiKeys).values({ integrationId: integration.id, label: parsed.data.label, prefix: material.prefix, secretHash: material.secretHash }).returning({ id: developerApiKeys.id, label: developerApiKeys.label, prefix: developerApiKeys.prefix, createdAt: developerApiKeys.createdAt });
  return Response.json({ key: created, secret: material.secret }, { status: 201 });
}

export async function DELETE(request: Request) {
  const account = await getAuthenticatedAccount();
  if (!account) return Response.json({ error: "Sign in required" }, { status: 401 });
  if (!getDatabaseUrl()) return Response.json({ error: "Developer workspace storage is not configured" }, { status: 503 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Key id is required" }, { status: 400 });
  const database = getDatabase();
  const [ownedKey] = await database
    .select({ id: developerApiKeys.id })
    .from(developerApiKeys)
    .innerJoin(developerIntegrations, eq(developerApiKeys.integrationId, developerIntegrations.id))
    .where(and(eq(developerApiKeys.id, id), eq(developerIntegrations.accountId, account.id)))
    .limit(1);
  if (!ownedKey) return Response.json({ error: "Key not found" }, { status: 404 });
  const [revoked] = await database.update(developerApiKeys).set({ revokedAt: new Date() }).where(eq(developerApiKeys.id, ownedKey.id)).returning({ id: developerApiKeys.id });
  if (!revoked) return Response.json({ error: "Key not found" }, { status: 404 });
  return Response.json({ revoked: revoked.id });
}
