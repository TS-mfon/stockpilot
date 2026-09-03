# StockPilot

StockPilot turns an investment thesis into a transparent, constraint-aware portfolio proposal for verified tokenized equity assets on Base.

## Safety boundary

The default runtime is `simulation`. The repository contains no private-key custody, no arbitrary transaction execution, and no unverified asset support. Live execution remains fail-closed until the asset registry, eligibility provider, venue adapter, smart-account permission, relayer, and Base settlement checks are configured and independently verified.

## Local development

```bash
npm install
npm run dev
```

Run the core tests with `npm test`. GenLayer contracts require the pinned runner and can be checked with `npm run contracts:lint` when `uvx` and the GenVM linter are available. Solidity tests require Foundry.

To deploy the three adjudicator/registry contracts to Studionet, set `GENLAYER_OPERATOR_PRIVATE_KEY` in a private shell and run `npm run genlayer:deploy`. The script writes `deployment.genlayer.json`; never commit that file if it contains operational secrets or unreviewed addresses.

Set `MONGODB_URI` and `MONGODB_DB_NAME` in Vercel for durable portfolio and audit persistence. `/api/health`, `/api/assets`, `/api/venues`, and `/api/genlayer/status` expose readiness without exposing secrets.

## Product boundary

The system has four trust layers: verified asset registry, evidence-backed research, deterministic portfolio mathematics, and user-approved execution. AI produces structured proposals only; it never produces addresses, calldata, permissions, or final execution authority.

This project is a software prototype, not a brokerage or investment recommendation service. Tokenized-stock availability and eligibility are jurisdiction-dependent.
