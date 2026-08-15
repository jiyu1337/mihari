# MIHARI owner guide

## Activate personal profiles and MIHARI MAP

MIHARI keeps public Observe mode available when Clerk is not configured. Personal profiles support email and password or wallet-native sign-in. Wallet sessions use `WALLET_SESSION_SECRET` when present and otherwise derive their signature from `CLERK_SECRET_KEY`.

1. Open the MIHARI project in Vercel.
2. Install Clerk from the Vercel Marketplace and connect it to the project.
3. In Clerk, keep email and password enabled as the email account method.
4. Confirm Vercel created `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` for Production and Preview.
5. Add `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`.
6. Redeploy the latest commit. The build automatically applies the Neon migration.
7. Open `/sign-up`, create an email and password account and confirm `/map` loads.

This setup works on the Vercel Hobby, Clerk Free and Neon Free plans for the current product stage.

This guide is written for a non-developer project owner. It will be expanded as each external service is connected.

## What already works locally

- Public landing page at `/`.
- Product onboarding at `/launch`.
- Event console at `/app`.
- Wallet detection or a no-wallet read-only path.
- Watchlist and protection-mode persistence in the browser.
- Corporate-action API adapter with safe demo fallback.
- Structured OpenAI analysis with deterministic fallback, Neon caching and a 25-analysis daily safety limit.
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

- `NEON_DATABASE_DATABASE_URL`: primary Neon Postgres connection created by the current Vercel Marketplace integration.
- `NEON_DATABASE_POSTGRES_URL`: compatible Neon connection variable used as a fallback.
- `DATABASE_URL`: temporary fallback for the previous manual connection; remove it after Neon is verified.
- `OPENAI_API_KEY`: direct OpenAI API key. Keep it server-only and marked Sensitive in Vercel.
- `MIHARI_AI_MODEL`: optional model override; defaults to `gpt-5-mini` for controlled cost.
- `MHR_HOLDER_THRESHOLD`: minimum combined `$MHR` balance across verified wallets for Holder access. The beta default is `1`.
- `ROBINHOOD_API_BASE_URL`: official Stock Token API host.
- `NEXT_PUBLIC_RPC_URL`: Robinhood Chain mainnet RPC.
- contract address variables after audited mainnet deployment.

## Current product limits

Public sessions can monitor 3 assets without a profile. Observer profiles can monitor 10 assets, verify 1 wallet, scan supported DeFi positions for that wallet and request 1 new AI analysis per rolling 24-hour window. MHR Holder profiles can monitor 30 assets, verify 5 wallets and request 10 new AI analyses. Holder access also unlocks multi-wallet DeFi scanning and the full Risk Graph.

The API enforces these limits. The interface explains the rule but is not the security boundary. Cached event analysis is reused without another model call. A rule-based explanation remains available when an AI limit is reached.

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

## Vercel deployment: upcoming connection step

1. Sign in to Vercel with the GitHub account that owns the repository.
2. Import the MIHARI repository.
3. Keep Framework Preset as Next.js and Root Directory as the repository root.
4. Add the environment variables from `.env.local` to Vercel.
5. Deploy a preview first.
6. Test `/`, `/launch`, `/app`, `/api/health` and `/api/corporate-actions`.
7. Promote to production only after those checks pass.

I will handle the commands and verify the deployment. You will only need to approve account access and choose the final domain.

## Database: upcoming connection step

Neon Postgres is connected through Vercel Marketplace. The production build applies reviewed, versioned Drizzle migrations before compiling the app.

To create a new migration after changing `db/schema.ts`:

```powershell
npm run db:generate
```

Review the generated SQL before committing it. Never use schema reset or destructive push commands against production.

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
