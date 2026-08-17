import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { parseShareSignal } from "@/lib/share-signal";

export const runtime = "nodejs";

function contextLabel(context: "holding" | "watchlist" | "guard") {
  if (context === "holding") return "VERIFIED HOLDING";
  if (context === "guard") return "GUARD DECISION";
  return "WATCHLIST / RESEARCH";
}

function Mark() {
  return (
    <svg width="150" height="150" viewBox="0 0 100 100">
      <path d="M7 7H44V34L32 24H23V45H7V7Z" fill="#F3F0E7" />
      <path d="M56 7H93V45H77V24H68L56 34V7Z" fill="#F3F0E7" />
      <path d="M7 56H23V77H44V93H7V56Z" fill="#F3F0E7" />
      <path d="M77 56H93V93H56V77H77V56Z" fill="#F3F0E7" />
      <rect x="58" y="55" width="6" height="6" fill="#CCFF00" />
    </svg>
  );
}

export async function GET(request: NextRequest) {
  const signal = parseShareSignal(request.nextUrl.searchParams) ?? {
    symbol: "MIHARI",
    eventType: "RISK SIGNAL",
    risk: "medium" as const,
    context: "watchlist" as const,
    systems: [],
  };
  const reviewArea = signal.systems.length ? signal.systems.join(" / ") : "EVENT CONTEXT";

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", color: "#F3F0E7", background: "#0B0B09", fontFamily: "Arial, sans-serif" }}>
      <div style={{ position: "absolute", inset: 34, display: "flex", border: "1px solid #777772" }} />
      <div style={{ height: 92, margin: "34px 34px 0", padding: "0 34px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #777772" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}><div style={{ width: 30, height: 30, display: "flex", background: "#CCFF00" }} /><strong style={{ fontSize: 27, letterSpacing: -1 }}>MIHARI</strong></div>
        <div style={{ display: "flex", fontSize: 15, letterSpacing: 3, color: "#AAA9A4" }}>PUBLIC SIGNAL / CHAIN 4663</div>
      </div>
      <div style={{ flex: 1, margin: "0 34px", padding: "30px 38px", display: "flex", alignItems: "center" }}>
        <div style={{ width: 260, display: "flex", justifyContent: "center" }}><Mark /></div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", paddingLeft: 30, borderLeft: "1px solid #777772" }}>
          <div style={{ display: "flex", marginBottom: 18, fontSize: 15, letterSpacing: 3, color: "#AAA9A4" }}>{contextLabel(signal.context)}</div>
          <div style={{ display: "flex", fontSize: 104, lineHeight: 0.9, letterSpacing: -7, fontWeight: 700 }}>{signal.symbol}</div>
          <div style={{ display: "flex", marginTop: 22, fontSize: 27, letterSpacing: 1 }}>{signal.eventType.replaceAll("_", " ")}</div>
        </div>
        <div style={{ width: 220, alignSelf: "stretch", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#10110D", background: signal.risk === "critical" ? "#FF5B3D" : "#CCFF00" }}>
          <div style={{ display: "flex", fontSize: 14, letterSpacing: 2 }}>REVIEW LEVEL</div>
          <strong style={{ marginTop: 18, fontSize: 31 }}>{signal.risk.toUpperCase()}</strong>
        </div>
      </div>
      <div style={{ height: 94, margin: "0 34px 34px", padding: "0 34px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #777772" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}><span style={{ fontSize: 13, letterSpacing: 2, color: "#AAA9A4" }}>REVIEW AREA</span><strong style={{ fontSize: 18 }}>{reviewArea}</strong></div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}><span style={{ fontSize: 15, letterSpacing: 2 }}>MAPPED BY @MIHARIDAPP</span><span style={{ width: 12, height: 12, display: "flex", background: "#CCFF00" }} /></div>
      </div>
    </div>,
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" } },
  );
}
