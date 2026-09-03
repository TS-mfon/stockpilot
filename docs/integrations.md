# Integration Runbook

## Coinbase/Base assets

Populate `data/seed/assets.json` only from current official issuer/Base sources. Verify chain ID 8453, checksum address, bytecode, metadata, issuer, transfer restrictions, and status. Never accept an address from an LLM or user prompt.

## GenLayer

Deploy the three contracts under `contracts/genlayer` with the pinned runner in each file. Store only canonical policy/decision hashes and bounded structured data. Raw prompts and research documents stay off-chain with content hashes.

## Wallet and permissions

Use a user-owned Base smart account. Permissions must name the executor, approved venue, token set, spend ceiling, expiry, nonce, and portfolio version. A material policy change requires reauthorization.

## Venue and relayer

Implement `SimulationAdapter` first. The live adapter must be selected only after route, quoter, router, fee, and transfer restrictions are verified for the exact assets. The relayer client must snapshot capabilities, estimate before submit, use idempotency keys, and reconcile against Base receipts.
