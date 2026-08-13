export type EventSeverity = "critical" | "watch" | "verified";

export type CorporateEvent = {
  id: string;
  time: string;
  asset: string;
  name: string;
  type: string;
  severity: EventSeverity;
  summary: string;
  impact: string;
  action: string;
  confidence: number | null;
  affected: number | null;
  proof: string | null;
  source: "robinhood" | "simulated";
  sourceStatus: string;
  sourcePayload?: Record<string, unknown>;
};

export const corporateEvents: CorporateEvent[] = [
  {
    id: "CA–014",
    time: "09:30:04",
    asset: "NVDA",
    name: "NVIDIA Tokenized Stock",
    type: "MULTIPLIER CHANGE",
    severity: "critical",
    summary: "Pending multiplier differs from the active asset configuration.",
    impact: "Quotes from two venues cannot be compared until the split-adjusted multiplier activates.",
    action: "Block stale quotes; pause new lending; prepare NAV rebalance after confirmation.",
    confidence: 98,
    affected: 6,
    proof: "0x8f31…d2a9",
    source: "simulated",
    sourceStatus: "SIMULATED",
  },
  {
    id: "CA–013",
    time: "08:12:51",
    asset: "AAPL",
    name: "Apple Tokenized Stock",
    type: "CASH DIVIDEND",
    severity: "watch",
    summary: "Cash dividend record date entered the active monitoring window.",
    impact: "Three vault NAV calculations require a receivable line before ex-date.",
    action: "Notify vault operators; stage dividend accrual; preserve trading policy.",
    confidence: 95,
    affected: 3,
    proof: "0x3bc1…8a44",
    source: "simulated",
    sourceStatus: "SIMULATED",
  },
  {
    id: "CA–012",
    time: "07:48:22",
    asset: "TSLA",
    name: "Tesla Tokenized Stock",
    type: "PRICE RECOVERY",
    severity: "verified",
    summary: "Underlying and multiplier-adjusted onchain feeds have converged.",
    impact: "Previously stale market can safely return to the normal quote policy.",
    action: "Resume quoting under guarded spread limits; write resolution receipt.",
    confidence: 99,
    affected: 2,
    proof: "0x1d94…7e10",
    source: "simulated",
    sourceStatus: "SIMULATED",
  },
];

export const protectionSteps = [
  {
    index: "01",
    label: "OBSERVE / 監視",
    title: "Read the official event",
    body: "Asset metadata, corporate actions and prices are normalized into one incident record.",
  },
  {
    index: "02",
    label: "INTERPRET / 解釈",
    title: "AI maps the consequences",
    body: "The agent explains affected positions, timing risk and the safest permitted response.",
  },
  {
    index: "03",
    label: "ENFORCE / 実行",
    title: "Policy controls the action",
    body: "Deterministic rules pause, restrict or rebalance connected onchain systems.",
  },
  {
    index: "04",
    label: "PROVE / 証明",
    title: "Robinhood Chain keeps the receipt",
    body: "The event hash, policy decision and execution proof become independently auditable.",
  },
];
