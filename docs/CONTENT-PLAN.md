# MIHARI Content Plan

The complete working content plan is maintained in this repository and covers positioning, short-form X posts, a 14-day publishing calendar, and 10-second feature-demo scripts.

## Positioning

MIHARI is an AI guardian for tokenized stocks. It tracks splits, dividends and multiplier changes, maps potential impact across NAV, vault and lending positions, and recommends a bounded response before a data mismatch becomes protocol risk.

Core message:

> Corporate actions don't stop at the asset layer.

## Communication rules

- One post, one idea.
- Do not present simulated events as live data.
- Do not present placeholder hashes as onchain receipts.
- Use `public preview` until the live data, persistence, AI and onchain flow are complete.
- Publish execution demos only after the relevant production feature is working.

## Launch post

> MIHARI is an AI guardian for tokenized stocks—tracking splits, dividends and multiplier changes.
>
> As tokenized stocks become composable across Robinhood Chain, one data mismatch can spread risk across multiple DeFi protocols.
>
> MIHARI detects the mismatch, maps affected positions and recommends a safe response before it becomes protocol risk.
>
> Launching today.

## 14-day publishing plan

| Day | Topic | Format |
|---|---|---|
| 1 | What is MIHARI? | Launch post |
| 2 | Corporate-action propagation risk | Problem post |
| 3 | How multipliers work | Educational post |
| 4 | Event Register | 10-second demo |
| 5 | Why a price feed is not enough | Educational post |
| 6 | The role of AI in MIHARI | Product/trust post |
| 7 | Split Detection | Demo after live integration |
| 8 | What is NAV? | Educational post |
| 9 | MIHARI for lending | Use-case post |
| 10 | AI Impact Map | 10-second demo |
| 11 | Why AI does not control funds | Trust post |
| 12 | Onchain proofs | Product vision post |
| 13 | Read-only watchlist setup | 10-second demo |
| 14 | What comes next | Roadmap post |

## Short-post library

### Corporate-action risk

> Corporate actions don't stop at the asset layer.
>
> A missed multiplier change can affect pricing, NAV, collateral and lending positions across DeFi.
>
> That propagation risk is what MIHARI monitors.

### Multiplier

> A stock split changes more than the displayed price.
>
> Token quantity, multiplier and protocol accounting must remain synchronized.
>
> MIHARI watches for the moment they diverge.

### Price semantics

> A valid price can still produce an invalid valuation.
>
> If the price and corporate-action multiplier represent different states, NAV and collateral calculations can become stale.

### AI in MIHARI

> AI in MIHARI doesn't authorize transactions.
>
> It interprets corporate actions, maps affected systems and explains the safest permitted response.
>
> Policy rules remain deterministic.

### NAV

> NAV is the calculated value behind a vault share.
>
> When a tokenized stock changes through a split or dividend, that calculation must change correctly—and at the right time.

### Lending

> If a tokenized stock is used as collateral, a stale valuation becomes lending risk.
>
> MIHARI identifies affected positions before recommending a pause, warning or manual review.

### Trust model

> AI proposes. Policy decides. The chain records.
>
> MIHARI separates analysis from authorization so a model never receives unchecked control over user funds.

### Onchain proofs

> A protection decision shouldn't disappear inside a black box.
>
> MIHARI is building onchain receipts for the event, evidence, policy decision and final response on Robinhood Chain.

### Roadmap

> What's next for MIHARI:
>
> → Live Stock Token data  
> → AI impact maps  
> → Vault and lending indexing  
> → Onchain policy receipts  
> → Bounded protection automation

## Video format

- Duration: 8–10 seconds.
- Robin Black background, ivory UI, Robin Neon only for an active signal.
- One feature per clip.
- Slow, clearly visible cursor movement.
- Maximum one short phrase on screen.
- Start immediately inside the product; no intro animation.
- Hold the final state for one second.

## Video 01 — Event Register

**Publish status:** available now as a clearly described product preview.

- `0–2s`: Open the Event Register.
- `2–5s`: Select a multiplier-change record.
- `5–8s`: Show Observation, Impact Map and Bounded Response.
- `8–10s`: Focus on source and affected-position status.

On-screen text:

> ONE EVENT.  
> EVERY AFFECTED POSITION.

Transcript:

> MIHARI turns a corporate action into a clear protocol risk report.

Post:

> From corporate action to protocol impact—in one incident file.

## Video 02 — Split Detection

**Publish status:** after live Stock Token integration, or mark it `CONCEPT`.

- `0–2s`: `Current multiplier: ×1`.
- `2–4s`: `Pending multiplier: ×4` appears.
- `4–7s`: MIHARI marks the mismatch.
- `7–10s`: policy recommendation changes to `PAUSE QUOTES`.

On-screen text:

> ×1 → ×4  
> MISMATCH DETECTED

Transcript:

> The price changed. The multiplier didn't. MIHARI catches the gap.

Post:

> A valid price and a stale multiplier can still create a wrong valuation.

## Video 03 — AI Impact Map

**Publish status:** as concept now; as live demo after AI is connected to the dashboard.

- `0–3s`: A corporate-action event enters MIHARI.
- `3–6s`: Lines connect it to `NAV`, `Vaults` and `Lending`.
- `6–8s`: At-risk positions highlight.
- `8–10s`: A bounded response appears.

On-screen text:

> EVENT → IMPACT → RESPONSE

Transcript:

> MIHARI maps where one market event can spread across DeFi.

Post:

> Corporate actions are events. Protocol exposure is a graph.

## Video 04 — Read-only Onboarding

**Publish status:** available now.

- `0–2s`: Select `Continue read-only`.
- `2–5s`: Select three Stock Tokens.
- `5–7s`: Select `OBSERVE`.
- `7–10s`: Open the dashboard.

On-screen text:

> NO WALLET.  
> NO FUNDS.  
> START MONITORING.

Transcript:

> Choose your assets and start monitoring without connecting a wallet.

Post:

> Monitoring should be easy to start. Wallet optional. No funds required.

## Video 05 — Policy Guardrails

**Publish status:** only after the policy engine works in production.

- `0–3s`: AI recommends `Pause lending`.
- `3–6s`: The policy engine checks permitted actions.
- `6–8s`: Show transaction preview.
- `8–10s`: Show `AWAITING USER APPROVAL`.

On-screen text:

> AI PROPOSES.  
> POLICY CONTROLS.

Transcript:

> AI recommends the response. Deterministic policy controls what can happen.

Post:

> Intelligence without unchecked execution.

## Video 06 — Onchain Receipt

**Publish status:** only after contract deployment and a real transaction.

- `0–3s`: Event becomes `VERIFIED`.
- `3–6s`: Turn the policy decision into a receipt.
- `6–8s`: Confirm the transaction.
- `8–10s`: Open the Robinhood Chain explorer.

On-screen text:

> DECISION RECORDED.  
> PROOF ONCHAIN.

Transcript:

> The evidence, policy decision and response become independently auditable.

Post:

> A protection decision shouldn't disappear inside a black box.

## Visual consistency

- Robin Black `#0B0B09`.
- Warm ivory `#F3F0E7`.
- Robin Neon `#CCFF00` only as the active signal.
- Exact MIHARI logo without reinterpretation.
- Japanese technical-manual and precision-instrument aesthetic.
- No crypto clichés, cyberpunk, coins, robots, candlestick charts or generic blockchain icons.
