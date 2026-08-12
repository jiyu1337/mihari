# MIHARI architecture

## Product boundary

MIHARI is a corporate-action protection system for tokenized stocks. It is intentionally hybrid:

- Robinhood Stock Token APIs provide read-only asset metadata, corporate actions and prices.
- The MIHARI indexer normalizes those records and stores provenance in Postgres.
- AI produces a structured impact analysis and a bounded recommendation.
- Deterministic policies decide whether an action is allowed.
- Robinhood Chain stores policy configuration, attestations and execution receipts.

This means the accurate public description is: **AI corporate-action protection built on Robinhood Chain**. It should not be described as fully onchain because official REST data and AI inference run offchain.

## Trust model

1. AI never receives a private key or direct custody.
2. Every analysis stores its input hash, model and prompt version.
3. Conflicting or incomplete evidence must fall back to manual review.
4. Onchain actions are limited by user-owned policy configuration.
5. Mainnet automation stays disabled until adapters and contracts are audited.

## Application layers

| Layer | Current implementation | Production target |
| --- | --- | --- |
| Web | Next.js App Router | Vercel |
| Database | Drizzle schema | Neon Postgres |
| AI | Vercel AI SDK with deterministic fallback | AI Gateway with model routing |
| Market data | Robinhood API adapter with demo fallback | Official Stock Token APIs |
| Chain | viem Robinhood testnet config | Testnet, then audited mainnet deployment |
| Contracts | Solidity + OpenZeppelin | Verified deployments on chain 46630/4663 |
| Monitoring | Health endpoint | Vercel Observability + Sentry/PostHog later |

## Main user flow

1. User opens the public incident story.
2. User launches MIHARI with a wallet or read-only identity.
3. User selects tokenized stocks and chooses Observe or Guard policy.
4. The event register shows normalized corporate actions.
5. The incident file explains evidence, impact, confidence and bounded response.
6. A Guard action requires wallet approval and writes a receipt to Robinhood Chain.

## Token utility

`MHR` is designed around system use, not promised yield:

- protection credits are consumed by burning MHR;
- guardians can later post MHR bonds that are slashable for provably invalid attestations;
- integrations can post MHR bonds to activate automated adapters;
- emergency public alerts remain free.

Token distribution, liquidity and launch contracts are deliberately not finalized in code. They require legal review, supply decisions, vesting parameters and an independent smart-contract audit.
