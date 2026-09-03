# StockPilot Architecture

## Trust boundary

The frontend and API provide previews and orchestration. The asset registry is authoritative for contract addresses. The portfolio engine is deterministic. GenLayer adjudicates mandate interpretation and rebalance proposals through structured outputs. The Base executor enforces allowlists, limits, nonce, deadline, and slippage. Settlement is accepted only after receipt and balance-delta verification.

## Launch gates

Live execution stays disabled until all gates have evidence in configuration and an audit record:

1. Current Coinbase tokenized-stock list, issuer, contract, decimals, transfer behavior, and eligibility rules are verified.
2. A Base venue is verified to list the selected assets with sufficient liquidity and compatible smart-account execution.
3. GenLayer network, runner, contracts, finality, and operator are configured.
4. Smart-account permissions are narrow, revocable, time-bounded, and bound to portfolio version.
5. Relayer capabilities, fee token, target address, request schema, and status model are verified.
6. Base fork tests prove expected token deltas and reject malformed instructions.
7. Eligibility is approved for the user and every selected asset.

If any gate is unknown, the system permits simulation and paper execution only.
