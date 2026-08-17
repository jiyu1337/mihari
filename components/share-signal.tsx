"use client";

import { Share2 } from "lucide-react";
import { shareSignalText, shareSignalUrl, type ShareContext, type ShareRisk } from "@/lib/share-signal";

type ShareSignalProps = {
  symbol: string;
  eventType: string;
  risk: ShareRisk;
  context: ShareContext;
  systems?: string[];
  className?: string;
};

export function ShareSignalButton({ symbol, eventType, risk, context, systems = [], className = "" }: ShareSignalProps) {
  function share() {
    const signal = { symbol, eventType, risk, context, systems };
    const intent = new URL("https://x.com/intent/post");
    intent.searchParams.set("text", shareSignalText(signal));
    intent.searchParams.set("url", shareSignalUrl(signal));
    window.open(intent.toString(), "mihari-share", "noopener,noreferrer,width=760,height=640");
  }

  return <button className={`share-signal-button ${className}`.trim()} type="button" onClick={share}><Share2 size={15} />SHARE SIGNAL</button>;
}

