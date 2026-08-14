# MIHARI architecture

## MIHARI MAP

MAP adds a personal identity and exposure layer without giving MIHARI custody of funds.

1. A user enters through Clerk email and password or an EVM wallet signature.
2. Wallet-native access receives a signed HttpOnly MIHARI session after server-side signature verification.
3. Neon stores the shared MIHARI account, personal watchlist and linked wallet records.
4. Email and wallet access can be attached to the same account without duplicating the workspace.
5. Blockscout returns ERC-20 balances for the verified Robinhood Chain address.
6. MIHARI keeps only contracts that match the official Robinhood Stock Token catalog.
7. Current corporate actions are matched to those personal positions.
8. The protocol exposure layer queries supported DeFi adapters for the same verified addresses.
9. Protocol assets are kept only when their contracts match the official Stock Token catalog.

### Protocol exposure adapter

The first adapter is Morpho on Robinhood Chain ID 4663. It queries read-only user market and vault positions and normalizes four position types: lending supply, lending collateral, lending borrow and vault deposit.

The adapter does not infer protocol balances from wallet transfers. It uses the protocol position API, then verifies asset contracts against Robinhood metadata. A corporate-action match is attached only when the Robinhood response is live. Simulated fallback events are never treated as personal protocol evidence.

The signature is not a transaction, costs no gas and grants no spending permission. MIHARI never receives a private key or seed phrase.

## Product boundary

MIHARI is a corporate-action protection system for tokenized stocks. It is intentionally hybrid:

- Robinhood Stock Token APIs provide read-only asset metadata, corporate actions and prices.
- Robinhood Chain Blockscout provides direct wallet token balances.
- Morpho provides read-only vault and lending positions for the first protocol adapter.
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
| Protocol positions | Morpho read-only API adapter | Multiple verified Robinhood Chain adapters |
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
