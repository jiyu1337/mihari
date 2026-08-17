import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { corporateActions, guardActions, wallets } from "@/db/schema";
import { getDatabase, getDatabaseUrl } from "@/db/client";
import { getAuthenticatedAccount } from "@/lib/account";
import { entitlementsFromHoldings } from "@/lib/entitlements";
import {
  buildGuardActionPreview,
  guardHash,
  serializeGuardAction,
} from "@/lib/guard-action";
import { mapWalletPositions } from "@/lib/map-data";
import type { CorporateEvent } from "@/lib/product-data";
import { getMarketSnapshot } from "@/lib/robinhood";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  eventId: z.string().trim().min(1).max(160),
  symbol: z.string().trim().min(1).max(24).transform((value) => value.toUpperCase()),
});

const decisionSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(["approve", "dismiss"]),
  confirmation: z.string().trim().max(64).optional().default(""),
  note: z.string().trim().max(280).optional().default(""),
});

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

function severityForDatabase(severity: CorporateEvent["severity"]): "low" | "medium" | "high" | "critical" {
  if (severity === "critical") return "critical";
  if (severity === "watch") return "high";
  return "low";
}

function eventDate(value: string) {
  if (!value || value === "PENDING") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function officialEvent(eventId: string, symbol: string) {
  const snapshot = await getMarketSnapshot([symbol]);
  if (snapshot.mode !== "live") return null;
  return snapshot.events.find((event) => (
    event.source === "robinhood"
    && event.sourcePayload
    && event.id === eventId
    && event.asset.toUpperCase() === symbol
  )) ?? null;
}

async function requireGuardAccess(accountId: string, symbol: string) {
  const database = getDatabase();
  const savedWallets = await database
    .select({ address: wallets.address, verified: wallets.verified })
    .from(wallets)
    .where(eq(wallets.accountId, accountId));
  const addresses = savedWallets.filter((wallet) => wallet.verified).map((wallet) => wallet.address);
  if (!addresses.length) {
    return { error: "Link and verify a wallet before preparing a Guard action", status: 403 } as const;
  }

  const exposure = await mapWalletPositions(addresses).catch(() => null);
  if (!exposure) {
    return { error: "Wallet verification is temporarily unavailable. No Guard action was created", status: 503 } as const;
  }
  const entitlements = entitlementsFromHoldings(exposure.mhrHoldings);
  if (entitlements.tier !== "holder") {
    return {
      error: `Hold at least ${Number(entitlements.holderThreshold).toLocaleString("en-US")} MHR in verified wallets to unlock Guard actions`,
      status: 403,
      code: "MHR_REQUIRED",
      entitlements,
    } as const;
  }
  const position = exposure.positions.find((candidate) => candidate.symbol.toUpperCase() === symbol);
  if (!position) {
    return {
      error: "Guard actions require a verified wallet holding. Watchlist assets remain advisory only",
      status: 403,
      code: "HOLDING_REQUIRED",
    } as const;
  }
  return { position, entitlements } as const;
}

export async function GET() {
  const account = await getAuthenticatedAccount();
  if (!account) return json({ error: "Unauthorized" }, 401);
  if (!getDatabaseUrl()) return json({ actions: [], warning: "Decision storage is unavailable" });

  const records = await getDatabase()
    .select()
    .from(guardActions)
    .where(eq(guardActions.accountId, account.id))
    .orderBy(desc(guardActions.createdAt))
    .limit(30);

  return json({ actions: records.map(serializeGuardAction) });
}

export async function POST(request: Request) {
  const account = await getAuthenticatedAccount();
  if (!account) return json({ error: "Unauthorized" }, 401);
  if (!getDatabaseUrl()) return json({ error: "Decision storage is unavailable" }, 503);

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "Invalid Guard action request" }, 400);

  const access = await requireGuardAccess(account.id, parsed.data.symbol);
  if ("error" in access) return json(access, access.status);

  const event = await officialEvent(parsed.data.eventId, parsed.data.symbol);
  if (!event?.sourcePayload) {
    return json({ error: "The event is no longer available from the official Robinhood source" }, 404);
  }

  const sourceHash = guardHash(event.sourcePayload);
  const preview = buildGuardActionPreview(event);
  const database = getDatabase();
  const [storedEvent] = await database
    .insert(corporateActions)
    .values({
      sourceId: event.id,
      symbol: event.asset,
      type: event.type,
      severity: severityForDatabase(event.severity),
      effectiveAt: eventDate(event.time),
      sourcePayload: event.sourcePayload,
      sourceHash,
    })
    .onConflictDoUpdate({
      target: corporateActions.sourceHash,
      set: { sourcePayload: event.sourcePayload, updatedAt: new Date() },
    })
    .returning({ id: corporateActions.id });

  if (!storedEvent) return json({ error: "Could not persist the verified event" }, 500);

  const [existing] = await database
    .select()
    .from(guardActions)
    .where(and(
      eq(guardActions.accountId, account.id),
      eq(guardActions.sourceHash, sourceHash),
      eq(guardActions.intent, preview.intent),
    ))
    .limit(1);

  if (existing?.status === "approved") {
    return json({ action: serializeGuardAction(existing), reused: true });
  }

  const [record] = existing
    ? await database
        .update(guardActions)
        .set({
          preview,
          status: "draft",
          approvalNote: null,
          decisionHash: null,
          approvedAt: null,
          updatedAt: new Date(),
        })
        .where(and(eq(guardActions.id, existing.id), eq(guardActions.accountId, account.id)))
        .returning()
    : await database
        .insert(guardActions)
        .values({
          accountId: account.id,
          corporateActionId: storedEvent.id,
          sourceEventId: event.id,
          sourceHash,
          symbol: event.asset,
          intent: preview.intent,
          preview,
        })
        .returning();

  if (!record) return json({ error: "Could not create the Guard preview" }, 500);
  return json({ action: serializeGuardAction(record), reused: Boolean(existing) }, 201);
}

export async function PATCH(request: Request) {
  const account = await getAuthenticatedAccount();
  if (!account) return json({ error: "Unauthorized" }, 401);
  if (!getDatabaseUrl()) return json({ error: "Decision storage is unavailable" }, 503);

  const parsed = decisionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "Invalid Guard decision" }, 400);

  const database = getDatabase();
  const [existing] = await database
    .select()
    .from(guardActions)
    .where(and(eq(guardActions.id, parsed.data.id), eq(guardActions.accountId, account.id)))
    .limit(1);
  if (!existing) return json({ error: "Guard action not found" }, 404);
  if (existing.status === "approved") return json({ action: serializeGuardAction(existing), reused: true });

  if (parsed.data.decision === "dismiss") {
    const [dismissed] = await database
      .update(guardActions)
      .set({ status: "dismissed", approvalNote: parsed.data.note || null, updatedAt: new Date() })
      .where(and(eq(guardActions.id, existing.id), eq(guardActions.accountId, account.id)))
      .returning();
    return json({ action: serializeGuardAction(dismissed!) });
  }

  if (parsed.data.confirmation !== `APPROVE ${existing.symbol.toUpperCase()}`) {
    return json({ error: `Type APPROVE ${existing.symbol.toUpperCase()} to confirm this decision` }, 400);
  }

  const access = await requireGuardAccess(account.id, existing.symbol.toUpperCase());
  if ("error" in access) return json(access, access.status);
  const event = await officialEvent(existing.sourceEventId, existing.symbol.toUpperCase());
  if (!event?.sourcePayload) {
    return json({ error: "The official event can no longer be verified. Refresh the Guard preview" }, 409);
  }
  if (guardHash(event.sourcePayload) !== existing.sourceHash) {
    return json({ error: "The official event changed. Prepare a new Guard preview before approval" }, 409);
  }

  const approvedAt = new Date();
  const decisionHash = guardHash({
    actionId: existing.id,
    accountId: account.id,
    sourceHash: existing.sourceHash,
    intent: existing.intent,
    preview: existing.preview,
    decision: "approved",
    approvedAt: approvedAt.toISOString(),
  });
  const [approved] = await database
    .update(guardActions)
    .set({
      status: "approved",
      approvalNote: parsed.data.note || null,
      decisionHash,
      approvedAt,
      updatedAt: approvedAt,
    })
    .where(and(eq(guardActions.id, existing.id), eq(guardActions.accountId, account.id)))
    .returning();

  return json({
    action: serializeGuardAction(approved!),
    receipt: {
      type: "private_decision_receipt",
      decisionHash,
      chainId: 4663,
      transactionHash: null,
      chainStatus: "not_submitted",
    },
  });
}
