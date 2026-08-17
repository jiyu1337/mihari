import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Eye, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { ShareSignalButton } from "@/components/share-signal";
import { parseShareSignal } from "@/lib/share-signal";

export const dynamic = "force-dynamic";

type SignalPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toUrlSearchParams(values: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === "string") params.set(key, value);
    else if (value?.[0]) params.set(key, value[0]);
  }
  return params;
}

function contextLabel(context: "holding" | "watchlist" | "guard") {
  if (context === "holding") return "VERIFIED HOLDING";
  if (context === "guard") return "GUARD DECISION";
  return "WATCHLIST / RESEARCH";
}

export async function generateMetadata({ searchParams }: SignalPageProps): Promise<Metadata> {
  const params = toUrlSearchParams(await searchParams);
  const signal = parseShareSignal(params);
  if (!signal) return { title: "MIHARI Shared Signal" };
  const title = `${signal.symbol} ${signal.eventType.replaceAll("_", " ")} | MIHARI Signal`;
  const description = `${contextLabel(signal.context)}. ${signal.risk.toUpperCase()} review signal from MIHARI on Robinhood Chain.`;
  const cardUrl = `https://mihari.pro/api/share-card?${params.toString()}`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website", url: `https://mihari.pro/signal?${params.toString()}`, images: [{ url: cardUrl, width: 1200, height: 630, alt: `${signal.symbol} MIHARI signal card` }] },
    twitter: { card: "summary_large_image", title, description, images: [cardUrl] },
  };
}

export default async function SignalPage({ searchParams }: SignalPageProps) {
  const signal = parseShareSignal(toUrlSearchParams(await searchParams));
  if (!signal) notFound();

  return (
    <main className="shared-signal-page paper-noise">
      <header className="shared-signal-header">
        <Link href="/" aria-label="MIHARI home"><BrandMark /><strong>MIHARI</strong></Link>
        <span className="mono">PUBLIC SIGNAL / ROBINHOOD CHAIN 4663</span>
      </header>
      <section className="shared-signal-card">
        <div className="shared-signal-index mono"><span>SHARED RISK SIGNAL</span><span>{contextLabel(signal.context)}</span></div>
        <div className="shared-signal-main">
          <div><p className="mono">ASSET / OFFICIAL EVENT</p><h1>{signal.symbol}</h1><h2>{signal.eventType.replaceAll("_", " ")}</h2></div>
          <div className={`shared-signal-risk ${signal.risk}`}><span className="mono">REVIEW LEVEL</span><strong>{signal.risk.toUpperCase()}</strong></div>
        </div>
        <div className="shared-signal-flow">
          <article><Eye size={22} /><span className="mono">01 / SOURCE</span><strong>Event context shared</strong></article>
          <ArrowRight size={22} />
          <article><ShieldCheck size={22} /><span className="mono">02 / CONTEXT</span><strong>{contextLabel(signal.context)}</strong></article>
          <ArrowRight size={22} />
          <article><BrandMark /><span className="mono">03 / MIHARI</span><strong>Impact mapped</strong></article>
        </div>
        <footer>
          <div><span className="mono">REVIEW AREA</span><strong>{signal.systems.length ? signal.systems.join(" / ") : "EVENT CONTEXT"}</strong></div>
          <p>No wallet address, balance or private receipt is included in this public signal.</p>
          <div className="shared-signal-actions"><ShareSignalButton {...signal} /><Link href="/launch">BUILD YOUR RISK MAP <ArrowRight size={15} /></Link></div>
        </footer>
      </section>
    </main>
  );
}
