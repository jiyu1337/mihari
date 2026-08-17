# MIHARI Content Plan

Updated for the production beta. This document separates what can be demonstrated today from future product layers.

## Current positioning

MIHARI is an AI guardian for tokenized stocks on Robinhood Chain. Users choose the assets they want to monitor; MIHARI reads official Robinhood asset, price, multiplier and corporate-action data, surfaces matching events and turns each event into a clear Incident File.

Current product statement:

> Monitor Robinhood Stock Tokens, understand corporate-action risk and receive a bounded response before a data mismatch spreads across DeFi.

Current capability statement:

> Live monitoring, AI analysis and bounded recommendations. No automatic execution or fund access.

## What is live now

- Full live Robinhood Stock Token catalog.
- Email and wallet-native profiles.
- Public watchlists of up to 3 assets, Observer watchlists of up to 10 assets and MHR Holder watchlists of up to 30 assets.
- Read-only onboarding without a wallet.
- Verified EVM wallets and automatic Stock Token holding discovery.
- Direct exposure, supported DeFi position mapping and the Unified Risk Graph.
- Official corporate-action Event Register.
- Robinhood price and multiplier context.
- AI Observation, Impact Map, risk level and Bounded Response.
- AI evidence-confidence score.
- Onchain `$MHR` balance checks and server-enforced product access.
- Neon persistence and analysis caching.

## What is coming next

- Protocol-specific policy preparation and approval.
- Bounded onchain execution.
- Audited Robinhood Chain contracts.
- Onchain decision and response receipts.
- Upcoming event timelines and dividend exposure when reliable official date fields are available.

Do not describe these roadmap features as live.

## Communication rules

- One post, one clear idea.
- Prefer screenshots and demos from the live product.
- State when data comes from Robinhood APIs.
- `AI confidence` means evidence quality, not price confidence.
- `Bounded response` is a recommendation, not an executed action.
- `Chain proof: not recorded` means no transaction was submitted.
- Never imply that MIHARI controls funds, pauses protocols or protects lending positions automatically today.
- Never present placeholder hashes or simulated records as onchain proof.

## Product workflow

1. Enter in read-only mode or connect an EVM wallet.
2. Search the live catalog and build a watchlist, or select every active asset.
3. Start Observe mode.
4. MIHARI syncs official Robinhood asset, price, multiplier and corporate-action data.
5. The Event Register shows watched assets with matching events.
6. The user opens an Incident File.
7. MIHARI explains the event, maps possible impact and recommends a bounded response.
8. An MHR Holder with a verified direct holding can prepare a Guard action.
9. The user reviews the complete preview and can record a private approval receipt. Nothing executes automatically.

## 14-day publishing plan

| Day | Topic | Format | Status |
|---|---|---|---|
| 1 | What is MIHARI? | Product introduction | Live |
| 2 | The product workflow | Short thread or carousel | Live |
| 3 | 20 watched assets vs a few events | Educational post | Live |
| 4 | Build a personal watchlist | 10-second demo | Live |
| 5 | Reading the Event Register | Educational post | Live |
| 6 | From official event to Incident File | 10-second demo | Live |
| 7 | What AI Confidence means | Trust post | Live |
| 8 | What is NAV? | Educational post | General education |
| 9 | Why multipliers matter | Educational post | General education |
| 10 | AI Impact Map | 10-second demo | Live |
| 11 | Why MIHARI is read-only today | Trust post | Live |
| 12 | Built on Robinhood Chain | Ecosystem post | Live foundation |
| 13 | Vault and lending discovery | Roadmap post | Coming next |
| 14 | Guard preview and private decision receipts | Product demo | Beta live |

## Short-post library

### Robinhood calendar and dividend update

Angle to save for a future response to Robinhood product updates:

> Robinhood tells you when an event is coming.
>
> MIHARI shows where that event can reach your onchain exposure and what should be reviewed.

Supporting idea:

> Earnings calendars and dividend trackers make upcoming events easier to see. MIHARI is building the next layer for Stock Tokens: match official corporate actions with direct wallet holdings and supported DeFi positions, then explain possible effects on NAV, collateral, vaults and liquidity.

Do not claim that MIHARI currently provides exact earnings, ex-dividend, record or payment dates. The Robinhood Stock Token corporate-actions API exposes event details and `processDate`, but `processDate` is not the dividend payable date. Add exact calendar dates only after a reliable official source is integrated.

### Product workflow

> Choose the Robinhood Stock Tokens you want to monitor.
>
> MIHARI watches official asset, price, multiplier and corporate-action data, surfaces relevant events and turns each one into a clear risk report.
>
> Live analysis. Bounded recommendations. No automatic execution.

### Watched assets vs events

> 20 watched assets does not mean 20 incidents.
>
> MIHARI monitors the full selected watchlist, but the Event Register only shows assets with a matching corporate-action record.
>
> Quiet assets remain monitored in the background.

### Event Register

> The MIHARI Event Register is an attention layer.
>
> It filters official Robinhood corporate actions through your watchlist, so you see the records that matter to your monitoring scope.

### Incident File

> One corporate action becomes one Incident File:
>
> Observation → Impact Map → Bounded Response.
>
> The source event remains visible. The AI explanation never replaces the evidence.

### AI Confidence

> AI Confidence in MIHARI is not a price prediction.
>
> It describes how complete and consistent the available event evidence is before MIHARI recommends a response.

### Read-only trust model

> MIHARI can monitor without a wallet.
>
> Wallet connection currently adds a public EVM identity and selects Robinhood Chain. It does not request a signature, transaction approval or access to funds.

### NAV

> NAV is the calculated value behind a vault or fund share.
>
> A dividend, split or multiplier change must be reflected correctly and at the right time, or downstream valuations can become stale.

### Multiplier

> A valid price can still produce an invalid valuation.
>
> If price data and the corporate-action multiplier represent different states, NAV and collateral calculations can diverge.

### Lending roadmap

> Corporate actions become lending risk when tokenized stocks are used as collateral.
>
> MIHARI’s next layer will discover affected positions and prepare a bounded policy response for operator approval.
>
> Coming next. This is not live execution today.

### Onchain proof roadmap

> A protection decision should not disappear inside a black box.
>
> MIHARI is building auditable Robinhood Chain receipts for evidence, policy decisions and final responses.
>
> Contracts and production receipts are coming next.

### Guard beta

> A recommendation should show its boundaries before anyone approves it.
>
> MIHARI Guard lets eligible MHR Holders prepare a bounded response for an official event matched to a verified wallet holding. The user reviews the scope, safety checks and closing conditions, then records a private decision receipt.
>
> No token approval. No fund movement. No protocol transaction in the current beta.

## Ten-second demo scripts

### Demo 01: Build a personal watchlist

**Status:** Live now.

- `0-2s`: Enter read-only mode.
- `2-5s`: Open the live Stock Token catalog.
- `5-7s`: Click `SELECT 20`.
- `7-10s`: Hold on `20 WATCHED` and continue to Observe.

On-screen text:

> ONE CLICK. FULL WATCH SCOPE.

Transcript:

> Select every active Robinhood Stock Token and start monitoring in seconds.

### Demo 02: Events vs watched assets

**Status:** Live now.

- `0-3s`: Show the watch-scope count.
- `3-6s`: Highlight the smaller event count.
- `6-10s`: Select one event in the register.

On-screen text:

> WATCH EVERYTHING. SURFACE WHAT CHANGED.

Transcript:

> MIHARI monitors your full watchlist and surfaces only matching corporate actions.

### Demo 03: Incident File

**Status:** Live now.

- `0-2s`: Select a corporate-action record.
- `2-4s`: Show event status, risk and record ID.
- `4-7s`: Move through Observation and Impact Map.
- `7-10s`: Hold on Bounded Response.

On-screen text:

> EVENT → IMPACT → RESPONSE

Transcript:

> One official event becomes a clear, bounded protocol risk report.

### Demo 04: AI Confidence

**Status:** Live now.

- `0-3s`: Open a live event.
- `3-6s`: AI analysis resolves.
- `6-10s`: Focus on confidence and the evidence labels.

On-screen text:

> EVIDENCE QUALITY. NOT PRICE PREDICTION.

Transcript:

> MIHARI scores the completeness of the evidence behind its recommendation.

### Demo 05: Read-only wallet flow

**Status:** Live now.

- `0-3s`: Click Connect Wallet.
- `3-6s`: Show Robinhood Chain selected.
- `6-10s`: Open Observe mode with the address label.

On-screen text:

> IDENTITY ONLY. NO FUND ACCESS.

Transcript:

> Connect an EVM identity without signing a transaction or granting fund access.

### Demo 06: Vault and lending discovery

**Status:** Coming next. Do not publish as a product demo yet.

- Show only as a clearly labelled concept or roadmap animation.
- Do not use live UI language until wallet position indexing exists.

### Demo 07: Onchain receipt

**Status:** Coming next. Publish only after audited contract deployment and a real explorer transaction.

## Visual consistency

- Robin Black `#0B0B09`.
- Warm ivory `#F3F0E7`.
- Robin Neon `#CCFF00` only for an active signal or selected state.
- Exact MIHARI logo without reinterpretation.
- Japanese technical-manual and precision-instrument aesthetic.
- Compact layouts with stable alignment; no floating decorative panels.
- No crypto clichés, cyberpunk, coins, robots, candlestick charts or generic blockchain icons.
