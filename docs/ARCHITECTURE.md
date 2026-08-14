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
10. The Risk Graph groups live Robinhood events, direct positions and normalized protocol positions by verified Stock Token identity.

The Risk Graph is deterministic relationship mapping. AI may explain an event in an Incident File, but AI does not create graph edges. A direct edge requires an official contract match. A perpetual edge requires an exact official symbol match after a supported quote suffix is removed.

### Protocol exposure adapters

The protocol layer uses a shared adapter interface. Every adapter receives one verified wallet and the current official Robinhood Stock Token catalog, then returns normalized positions and an explicit scan status.

- Morpho reads user market and vault positions. It normalizes lending supply, collateral, borrow and vault deposit exposure.
- Uniswap V3 finds Position Manager NFTs through Robinhood Chain Blockscout. It reads position liquidity, pool state and unclaimed token amounts onchain.
- Uniswap V4 finds Position Manager NFTs, reads PoolKey and packed tick data, then uses the official StateView contract to calculate the token amounts represented by the position.
- Arcus reads its public account-position API and matches RWA perpetual market names to official Stock Token symbols.
- Lighter reads public accounts and subaccounts through the Robinhood Chain Lighter API. It keeps active perpetual positions whose symbols match the official Stock Token catalog.

Uniswap adapters keep only the side of an LP position whose contract matches official Robinhood metadata. They also report whether concentrated liquidity is active or outside its configured tick range. Unknown assets are excluded.

Perpetual adapters do not assume that a market is a Stock Token from its category or display name alone. Arcus and Lighter rows are kept only when the normalized market symbol matches an exact symbol in the current official Robinhood catalog.

A corporate-action match is attached only when the Robinhood response is live. Simulated fallback events are never treated as personal protocol evidence. A failed adapter is reported as partial or unavailable and is never interpreted as zero exposure.

### Protocol registry

| Source | Category | Current stage | Position data used |
| --- | --- | --- | --- |
| Morpho | Lending | Live adapter | User markets and vault positions |
| Uniswap V3 | DEX | Beta adapter | Position Manager NFT, pool slot0 and liquidity |
| Uniswap V4 | DEX | Beta adapter | Position Manager NFT, PoolKey, StateView slot0 and liquidity |
| Rialto | DEX | Planned | No user-position scan yet |
| Lighter | Perpetuals | Beta adapter | Public accounts, active positions, side, margin and PnL |
| Arcus | Perpetuals | Beta adapter | Public positions, side, leverage, margin and PnL |
| Chainlink | Oracle | Planned | No dependency graph scan yet |

The UI shows the whole registry but counts only adapters that actually ran as checked. This prevents roadmap coverage from being mistaken for verified wallet coverage.

### Verified Uniswap contracts on Robinhood Chain

| Contract | Address |
| --- | --- |
| Uniswap V3 Factory | `0x1f7d7550b1b028f7571e69a784071f0205fd2efa` |
| Uniswap V3 Nonfungible Position Manager | `0x73991a25c818bf1f1128deaab1492d45638de0d3` |
| Uniswap V4 Pool Manager | `0x8366a39cc670b4001a1121b8f6a443a643e40951` |
| Uniswap V4 Position Manager | `0x58daec3116aae6d93017baaea7749052e8a04fa7` |
| Uniswap V4 StateView | `0xf3334192d15450cdd385c8b70e03f9a6bd9e673b` |

These addresses are read-only dependencies. MIHARI does not ask a user to approve either Position Manager.

The signature is not a transaction, costs no gas and grants no spending permission. MIHARI never receives a private key or seed phrase.

## Product boundary

MIHARI is a corporate-action protection system for tokenized stocks. It is intentionally hybrid:

- Robinhood Stock Token APIs provide read-only asset metadata, corporate actions and prices.
- Robinhood Chain Blockscout provides direct wallet token balances.
- Morpho provides read-only vault and lending positions.
- Robinhood Chain and Blockscout provide Uniswap V3 and V4 NFT ownership and contract state.
- Arcus and Lighter provide read-only public perpetual-position data.
- The MIHARI indexer normalizes those records and stores provenance in Postgres.
- The Risk Graph connects only live official events to verified direct and supported protocol exposure.
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
| Protocol positions | Morpho, Uniswap V3, Uniswap V4, Arcus and Lighter read-only adapters | Additional verified Robinhood Chain adapters |
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
