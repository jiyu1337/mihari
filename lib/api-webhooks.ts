import "server-only";

import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { apiWebhookDeliveries, apiWebhookSubscriptions } from "@/db/schema";
import { getDatabase } from "@/db/client";
import { evidenceHash } from "@/lib/intelligence";
import { publicEvent } from "@/lib/public-api";
import type { CorporateEvent } from "@/lib/product-data";

export const WEBHOOK_EVENT_TYPES = ["corporate_action.updated"] as const;
export type WebhookEventType = typeof WEBHOOK_EVENT_TYPES[number];

function encryptionKey() {
  const secret = process.env.MIHARI_WEBHOOK_ENCRYPTION_KEY?.trim();
  if (!secret || secret.length < 32) throw new Error("MIHARI_WEBHOOK_ENCRYPTION_KEY must be configured with at least 32 characters");
  return createHash("sha256").update(secret).digest();
}

export function encryptWebhookSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${ciphertext.toString("base64url")}`;
}

function decryptWebhookSecret(value: string) {
  const [ivEncoded, tagEncoded, ciphertextEncoded] = value.split(".");
  if (!ivEncoded || !tagEncoded || !ciphertextEncoded) throw new Error("Webhook secret cannot be decrypted");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivEncoded, "base64url"));
  decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextEncoded, "base64url")), decipher.final()]).toString("utf8");
}

export function safeWebhookUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    const hostname = url.hostname.toLowerCase();
    if (hostname === "localhost" || hostname.endsWith(".local") || /^127\./.test(hostname) || hostname === "::1") return null;
    return url;
  } catch {
    return null;
  }
}

function payloadFor(type: WebhookEventType, event: CorporateEvent) {
  const revision = event.sourcePayload ? `sha256:${evidenceHash(event.sourcePayload)}` : event.id;
  return {
    type,
    id: `wh_${evidenceHash({ type, revision }).slice(0, 32)}`,
    occurredAt: new Date().toISOString(),
    data: { event: publicEvent(event) },
  };
}

async function send(url: string, secret: string, type: string, payload: unknown) {
  const raw = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest("hex");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "MIHARI-Intelligence-Webhook/1.0",
      "MIHARI-Event": type,
      "MIHARI-Timestamp": timestamp,
      "MIHARI-Signature": `sha256=${signature}`,
    },
    body: raw,
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Webhook receiver returned ${response.status}`);
  return response.status;
}

export async function deliverCorporateActionWebhooks(events: CorporateEvent[]) {
  const database = getDatabase();
  const subscriptions = await database
    .select()
    .from(apiWebhookSubscriptions)
    .where(eq(apiWebhookSubscriptions.active, true));

  let attempted = 0;
  let delivered = 0;
  let skipped = 0;
  for (const subscription of subscriptions) {
    if (!subscription.eventTypes.includes("corporate_action.updated")) continue;
    for (const event of events.slice(0, 25)) {
      if (!event.sourcePayload) continue;
      const fingerprint = evidenceHash({ type: "corporate_action.updated", event: event.sourcePayload });
      const [existing] = await database
        .select({ id: apiWebhookDeliveries.id })
        .from(apiWebhookDeliveries)
        .where(and(
          eq(apiWebhookDeliveries.subscriptionId, subscription.id),
          eq(apiWebhookDeliveries.fingerprint, fingerprint),
        ))
        .limit(1);
      if (existing) {
        skipped += 1;
        continue;
      }
      const [delivery] = await database.insert(apiWebhookDeliveries).values({
        subscriptionId: subscription.id,
        eventType: "corporate_action.updated",
        fingerprint,
      }).returning();
      if (!delivery) continue;
      attempted += 1;
      try {
        const responseStatus = await send(subscription.url, decryptWebhookSecret(subscription.secret), "corporate_action.updated", payloadFor("corporate_action.updated", event));
        await database.update(apiWebhookDeliveries)
          .set({ status: "delivered", responseStatus, deliveredAt: new Date() })
          .where(eq(apiWebhookDeliveries.id, delivery.id));
        delivered += 1;
      } catch (error) {
        await database.update(apiWebhookDeliveries)
          .set({ status: "failed", error: error instanceof Error ? error.message.slice(0, 500) : "Delivery failed" })
          .where(eq(apiWebhookDeliveries.id, delivery.id));
      }
    }
  }
  return { subscriptionCount: subscriptions.length, attempted, delivered, skipped };
}

export async function sendWebhookTest(id: string) {
  const database = getDatabase();
  const [subscription] = await database.select().from(apiWebhookSubscriptions).where(eq(apiWebhookSubscriptions.id, id)).limit(1);
  if (!subscription) throw new Error("Webhook subscription not found");
  return send(subscription.url, decryptWebhookSecret(subscription.secret), "webhook.test", {
    type: "webhook.test",
    id: `wh_test_${Date.now()}`,
    occurredAt: new Date().toISOString(),
    data: { message: "MIHARI webhook delivery test" },
  });
}
