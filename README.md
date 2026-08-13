# MIHARI

**AI corporate-action intelligence for tokenized stocks on Robinhood Chain.**

[Live product](https://mihari-eight.vercel.app) · [Documentation](https://mihari-eight.vercel.app/docs) · [Launch app](https://mihari-eight.vercel.app/launch)

MIHARI monitors official Robinhood Stock Token metadata, prices, multipliers and corporate actions. When a dividend, split or multiplier change appears, it turns the source event into a clear Incident File: what changed, where risk may spread and what a safe response could look like.

## What users can do today

1. Enter without a wallet or connect an EVM address in read-only mode.
2. Select individual Stock Tokens or monitor the full live catalog.
3. Start Observe mode.
4. Review corporate actions matching the selected watchlist.
5. Open an Incident File with the event status, risk, evidence and AI confidence.
6. Read the Observation, Impact Map and Bounded Response.

MIHARI currently monitors and recommends. It does not move funds or execute transactions automatically.

## Live product capabilities

- Live Robinhood Stock Token catalog and watchlists.
- Official corporate-action Event Register.
- Robinhood price and multiplier context.
- Structured AI impact analysis with deterministic fallback.
- Neon Postgres persistence and analysis caching.
- Optional read-only wallet connection on Robinhood Chain, chain ID `4663`.
- Responsive product UI and plain-language documentation.

## $MHR token

`$MHR` powers the future MIHARI protection network.

| Field | Value |
| --- | --- |
| Network | Robinhood Chain |
| Symbol | `$MHR` |
| Contract | `0x92150e06BAc43011cBe099b2830D947Ee3099809` |
| Explorer | [View on Robinhood Chain Blockscout](https://robinhoodchain.blockscout.com/address/0x92150e06BAc43011cBe099b2830D947Ee3099809) |

Planned utility:

- **Hold** to unlock premium monitoring and AI features.
- **Lock** for higher limits, product credits and lower usage fees.
- **Spend** on AI analysis, APIs, position scans and future onchain proofs.
- **Stake** to support future network security and operator incentives.
- **Burn** a portion of usage fees as the product is used.

Always verify the contract address before interacting. Token utility features described above are a product roadmap and are not all active today.

## Architecture

```text
Robinhood Stock Token APIs
            ↓
   Normalization and checks
            ↓
 AI analysis + rule fallback
            ↓
    Neon incident memory
            ↓
     MIHARI Event Register
```

The application is intentionally hybrid: official market data and AI inference run offchain, while future policy configuration, execution receipts and attestations are designed for Robinhood Chain.

Main stack:

- Next.js 16 and React 19
- TypeScript
- Vercel AI SDK and OpenAI
- Neon Postgres and Drizzle ORM
- viem
- Solidity and OpenZeppelin

## Local development

Requirements:

- Node.js 22 or newer
- npm

```bash
git clone https://github.com/jiyu1337/mihari.git
cd mihari
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The interface can run without database or AI credentials by using its safe fallback paths. Add server-side credentials to `.env.local` when testing the full stack. Never prefix secrets with `NEXT_PUBLIC_`.

## Environment variables

Use [.env.example](./.env.example) as the source of truth.

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Server-side AI analysis |
| `MIHARI_AI_MODEL` | OpenAI model selection |
| `NEON_DATABASE_DATABASE_URL` or another supported Neon URL | Incident persistence and AI caching |
| `ROBINHOOD_API_BASE_URL` | Robinhood Stock Token API base URL |
| `NEXT_PUBLIC_CHAIN_ID` | Robinhood Chain ID |
| `NEXT_PUBLIC_RPC_URL` | Public Robinhood Chain RPC |

## Commands

```bash
npm run dev               # Start local development
npm run typecheck         # Generate route types and run TypeScript
npm run lint              # Run ESLint
npm run build             # Run migrations and create a production build
npm run db:migrate        # Apply database migrations
npm run contracts:compile # Compile the Solidity contracts
```

## Current boundaries

The following features are not live yet:

- wallet-based vault and lending position discovery;
- automatic policy execution;
- production onchain attestations and protection receipts;
- independent operators, staking, rewards and slashing;
- audited production deployment of the repository contracts.

The Solidity contracts in this repository are unaudited reference implementations. Do not use them to secure production funds.

## Documentation

- [Product-owner setup](./docs/OWNER-GUIDE.md)
- [Technical and trust architecture](./docs/ARCHITECTURE.md)
- [Content and demo plan](./docs/CONTENT-PLAN.md)
- [Robinhood Chain contracts](./contracts/README.md)
- [Public product documentation](https://mihari-eight.vercel.app/docs)

## Security

- Never commit `.env` or `.env.local`.
- Never expose `OPENAI_API_KEY`, database credentials or wallet private keys to the browser.
- MIHARI will never ask for a seed phrase or private key.
- Report a suspected credential leak privately before opening a public issue.

## Disclaimer

MIHARI is an independent software project. It is not a broker, financial adviser or investment service. Product analysis is informational and does not guarantee financial outcomes.
