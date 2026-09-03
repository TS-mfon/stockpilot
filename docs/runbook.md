# Deployment Runbook

## GitHub and Vercel

1. Push this repository to a private or public GitHub repository.
2. Import it into Vercel with the repository root set to `/home/sudodave/stockpilot`.
3. Configure the variables in `.env.example` in Vercel Preview first.
4. Set `NEXT_PUBLIC_MODE=simulation` until all verification gates pass.
5. Configure `MONGODB_URI`, `MONGODB_DB_NAME`, and `CRON_SECRET`.
6. Verify `/api/health`, `/api/assets`, `/api/venues`, and `/api/genlayer/status`.

## Studionet

Use a funded operator account only in a local shell or Vercel secret. Run `npm run genlayer:deploy`, inspect the generated addresses, then configure the three contract address variables. Confirm each contract with a readback call before accepting a portfolio as consensus-committed.

## Base Sepolia

The current repository deliberately ships a fail-closed simulation adapter. Before enabling testnet execution, replace the demo asset and venue registries with verified Base Sepolia deployments, add a real quote/route adapter, implement smart-account permission verification, and add receipt/balance-delta reconciliation. Set `NEXT_PUBLIC_MODE=testnet` only after those checks are automated.

## Mainnet pilot

Do not set `MAINNET_PILOT_ENABLED=true` merely to remove a banner. Require a separate allowlist, per-wallet limits, a kill switch, verified assets and venue routes, signed permissions, relayer capability snapshots, and settlement reconciliation. Public visitors can always use simulation mode.
