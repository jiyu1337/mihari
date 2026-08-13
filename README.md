# MIHARI

AI corporate-action protection for tokenized stocks on Robinhood Chain.

MIHARI monitors official Robinhood Stock Token metadata, prices and corporate actions; uses AI to explain protocol impact; and preserves each analysis in Neon.

Production beta: [mihari-eight.vercel.app](https://mihari-eight.vercel.app)

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Documentation

- Product-owner setup: `docs/OWNER-GUIDE.md`
- Technical and trust architecture: `docs/ARCHITECTURE.md`
- Robinhood Chain contracts: `contracts/README.md`
- Plain-language product documentation: `/docs` in the deployed application

## Status

Live Robinhood data, OpenAI analysis and Neon caching are active in production. Wallet connection is read-only. Vault/lending position indexing, policy execution and onchain receipts are not yet enabled.
