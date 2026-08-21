import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { apiWebhookDeliveries, apiWebhookSubscriptions } from "@/db/schema";
import { getDatabase, getDatabaseUrl } from "@/db/client";
import { encryptWebhookSecret, safeWebhookUrl, sendWebhookTest, WEBHOOK_EVENT_TYPES } from "@/lib/api-webhooks";
import { apiAdminAuthorized, optionsResponse, publicApiError, publicApiResponse } from "@/lib/public-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  label: z.string().trim().min(2).max(80),
  url: z.string().trim().url().max(500),
  secret: z.string().min(24).max(256),
  eventTypes: z.array(z.enum(WEBHOOK_EVENT_TYPES)).min(1).max(WEBHOOK_EVENT_TYPES.length),
});

function unauthorized() {
  return publicApiError("A valid MIHARI integration API key is required", 401);
}

function serialize(subscription: typeof apiWebhookSubscriptions.$inferSelect, delivery?: typeof apiWebhookDeliveries.$inferSelect) {
  return {
    id: subscription.id,
    label: subscription.label,
    url: subscription.url,
    eventTypes: subscription.eventTypes,
    active: subscription.active,
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt,
    lastDelivery: delivery ? {
      status: delivery.status,
      eventType: delivery.eventType,
      responseStatus: delivery.responseStatus,
      deliveredAt: delivery.deliveredAt,
      createdAt: delivery.createdAt,
    } : null,
  };
}

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: Request) {
  if (!apiAdminAuthorized(request)) return unauthorized();
  if (!getDatabaseUrl()) return publicApiError("Webhook storage is not configured", 503);
  const database = getDatabase();
  const subscriptions = await database.select().from(apiWebhookSubscriptions).orderBy(desc(apiWebhookSubscriptions.createdAt));
  const deliveries = await database.select().from(apiWebhookDeliveries).orderBy(desc(apiWebhookDeliveries.createdAt)).limit(100);
  return publicApiResponse({
    eventTypes: WEBHOOK_EVENT_TYPES,
    signing: { algorithm: "HMAC-SHA256", signedValue: "${timestamp}.${rawBody}", header: "MIHARI-Signature: sha256=<digest>" },
    subscriptions: subscriptions.map((subscription) => serialize(subscription, deliveries.find((delivery) => delivery.subscriptionId === subscription.id))),
  }, { cacheControl: "no-store" });
}

export async function POST(request: Request) {
  if (!apiAdminAuthorized(request)) return unauthorized();
  if (!getDatabaseUrl()) return publicApiError("Webhook storage is not configured", 503);
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return publicApiError("Invalid webhook subscription payload", 400);
  if (!safeWebhookUrl(parsed.data.url)) return publicApiError("Webhook URL must be a public HTTPS URL", 400);
  try {
    const [subscription] = await getDatabase().insert(apiWebhookSubscriptions).values({
      ...parsed.data,
      secret: encryptWebhookSecret(parsed.data.secret),
    }).returning();
    if (!subscription) return publicApiError("Could not create webhook subscription", 500);
    return publicApiResponse({ subscription: serialize(subscription) }, { status: 201, cacheControl: "no-store" });
  } catch (error) {
    return publicApiError(error instanceof Error ? error.message : "Could not create webhook subscription", 503);
  }
}

export async function DELETE(request: Request) {
  if (!apiAdminAuthorized(request)) return unauthorized();
  if (!getDatabaseUrl()) return publicApiError("Webhook storage is not configured", 503);
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !z.string().uuid().safeParse(id).success) return publicApiError("Valid webhook id is required", 400);
  const [deleted] = await getDatabase().delete(apiWebhookSubscriptions).where(eq(apiWebhookSubscriptions.id, id)).returning({ id: apiWebhookSubscriptions.id });
  if (!deleted) return publicApiError("Webhook subscription not found", 404);
  return publicApiResponse({ deleted: deleted.id }, { cacheControl: "no-store" });
}

export async function PATCH(request: Request) {
  if (!apiAdminAuthorized(request)) return unauthorized();
  if (!getDatabaseUrl()) return publicApiError("Webhook storage is not configured", 503);
  const payload = await request.json().catch(() => null) as { id?: string; action?: string } | null;
  if (!payload?.id || !z.string().uuid().safeParse(payload.id).success || payload.action !== "test") {
    return publicApiError("Use { id, action: 'test' } to send a signed test delivery", 400);
  }
  try {
    const responseStatus = await sendWebhookTest(payload.id);
    return publicApiResponse({ tested: payload.id, responseStatus }, { cacheControl: "no-store" });
  } catch (error) {
    return publicApiError(error instanceof Error ? error.message : "Webhook test failed", 502);
  }
}
