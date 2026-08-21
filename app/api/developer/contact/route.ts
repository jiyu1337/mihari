import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDatabase, getDatabaseUrl } from "@/db/client";
import { developerAccessRequests, developerIntegrations } from "@/db/schema";
import { getAuthenticatedAccount } from "@/lib/account";

export const runtime = "nodejs";
const requestSchema = z.object({ integrationId: z.string().uuid(), requestedPlan: z.enum(["builder", "protocol"]), projectName: z.string().trim().min(2).max(120), contactEmail: z.string().trim().email().max(160), expectedMonthlyRequests: z.coerce.number().int().min(1).max(100000000), useCase: z.string().trim().min(10).max(1000) });

export async function POST(request: Request) {
  const account = await getAuthenticatedAccount();
  if (!account) return Response.json({ error: "Sign in required" }, { status: 401 });
  if (!getDatabaseUrl()) return Response.json({ error: "Developer workspace storage is not configured" }, { status: 503 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Please complete the project, email, volume and use case fields" }, { status: 400 });
  const database = getDatabase();
  const [integration] = await database.select({ id: developerIntegrations.id }).from(developerIntegrations).where(and(eq(developerIntegrations.id, parsed.data.integrationId), eq(developerIntegrations.accountId, account.id))).limit(1);
  if (!integration) return Response.json({ error: "Integration not found" }, { status: 404 });
  const { integrationId: _integrationId, ...requestValues } = parsed.data;
  const [saved] = await database.insert(developerAccessRequests).values({ accountId: account.id, integrationId: integration.id, ...requestValues }).returning({ id: developerAccessRequests.id, status: developerAccessRequests.status, createdAt: developerAccessRequests.createdAt });
  await database.update(developerIntegrations).set({ status: "contact_requested", updatedAt: new Date() }).where(eq(developerIntegrations.id, integration.id));
  return Response.json({ request: saved, message: "Request received. MIHARI team review is manual during the beta." }, { status: 201 });
}
