# MIHARI owner guide

This guide is written for a non-developer project owner. It will be expanded as each external service is connected.

## What already works locally

- Public landing page at `/`.
- Product onboarding at `/launch`.
- Event console at `/app`.
- Wallet detection or a no-wallet read-only path.
- Watchlist and protection-mode persistence in the browser.
- Corporate-action API adapter with safe demo fallback.
- Structured AI endpoint with deterministic fallback when no AI key is present.
- Postgres schema for users, wallets, watchlists, events, analyses and receipts.
- Compilable Robinhood Chain smart contracts.

## Run the project

1. Open PowerShell.
2. Enter the project folder:

```powershell
cd C:\Users\Voronovskiy\Documents\Codex\MIHARI
```

3. Install packages if this is a new computer:

```powershell
npm install
```

4. Start the app:

```powershell
npm run dev
```

5. Open `http://localhost:3000` in a browser.

Stop it with `Ctrl+C` in PowerShell.

## Environment variables

Never put keys directly in source files or send them in public chat. Copy `.env.example` to `.env.local` and fill the values there. `.env.local` is excluded from Git.

Required for the next production milestone:

- `DATABASE_URL`: Neon Postgres connection string.
- `AI_GATEWAY_API_KEY`: Vercel AI Gateway key.
- `ROBINHOOD_API_BASE_URL`: official Stock Token API host.
- `NEXT_PUBLIC_RPC_URL`: Robinhood Chain testnet RPC.
- contract address variables after testnet deployment.

## Quality commands

Run these before every GitHub push:

```powershell
npm run typecheck
npm run lint
npm run build
npm run contracts:compile
```

## GitHub workflow

The local folder is the source of truth. We will create a GitHub repository after the first stable milestone.

Normal future flow:

```powershell
git status
git add .
git commit -m "Describe the change"
git push
```

You will not need to write these commands yourself while we are collaborating; they are documented so the project never depends on one person.

## Vercel deployment — upcoming connection step

1. Sign in to Vercel with the GitHub account that owns the repository.
2. Import the MIHARI repository.
3. Keep Framework Preset as Next.js and Root Directory as the repository root.
4. Add the environment variables from `.env.local` to Vercel.
5. Deploy a preview first.
6. Test `/`, `/launch`, `/app`, `/api/health` and `/api/corporate-actions`.
7. Promote to production only after those checks pass.

I will handle the commands and verify the deployment. You will only need to approve account access and choose the final domain.

## Database — upcoming connection step

Neon Postgres is the planned database because it connects directly to Vercel and works with the existing Drizzle schema.

After Neon is provisioned:

```powershell
npm run db:generate
npm run db:migrate
```

No production migration should be run without a backup and a reviewed migration file.

## Smart-contract safety

Current contracts compile but are unaudited. They are safe only for local work and Robinhood Chain testnet experimentation. Never deploy them to mainnet or add meaningful liquidity before:

1. unit and invariant tests;
2. an external security audit;
3. multisig ownership;
4. a documented emergency process;
5. legal review of the token launch.

## What you will have to decide later

- Public or private GitHub repository before launch.
- Domain name.
- Company email and alert sender domain.
- Final MHR supply, allocation and vesting.
- Which vault/lending protocol becomes the first protected integration.

Everything else can be prepared technically before those decisions.
