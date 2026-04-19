# scalus-treasury

Operational setup for the Cardano treasury withdrawal funding
**Scalus Application Platform and Node Diversity**.

This repo parameterizes and operates the audited SundaeSwap
[`treasury-funds`](https://github.com/SundaeSwap-finance/treasury-funds)
contracts. It does **not** contain any contract code of its own.

## Status

- Preprod: in development
- Mainnet: placeholder config only

## Prerequisites

- [Bun](https://bun.sh) >= 1.1
- A Blockfrost preprod project id (free tier works): https://blockfrost.io
- `cardano-cli` (Conway era) for submitting the governance action

## Quickstart (preprod)

```bash
cp .env.example .env
# edit .env: set BLOCKFROST_PROJECT_ID

bun install
bun run gen-keys       # create keys/admin.{skey,vkey,addr}
# fund the admin address on preprod faucet: https://docs.cardano.org/cardano-testnets/tools/faucet

bun run init           # mint registry NFT, publish registry datum
bun run register       # register + delegate scripts to AlwaysAbstain DRep
bun run gov            # emit gov/preprod-withdrawal.json + cardano-cli command
# submit the governance action manually (see stdout instructions)
# wait for the action to pass on preprod

bun run withdraw       # pull funds from the treasury reward account
bun run fund           # fund the vendor contract with the single milestone
# wait for milestone maturation (~30 days)
bun run vendor-withdraw
```

Every script accepts `--submit` to actually broadcast (default is `--dry-run`,
which builds and prints a summary without submitting).

## Layout

- `params/preprod.ts` — concrete preprod values (runnable)
- `params/mainnet.ts` — placeholders (NOT runnable; fill in for mainnet)
- `scripts/0X-*.ts` — operational flow in order
- `scripts/lib/` — shared provider, config, and state helpers
- `gov/anchor.json` — CIP-108 anchor stub (preprod)
- `deployment/*.json` — machine-written derived state (gitignored)
- `keys/` — script-generated keys (gitignored)
- `docs/superpowers/specs/` — design docs
- `docs/superpowers/plans/` — implementation plans

## Security

- All keys under `keys/` are gitignored. Only generate keys for preprod.
  Mainnet signing is expected to happen out-of-band (hardware wallets +
  `cardano-cli`).
- `.env` is gitignored; only `.env.example` is checked in.
- The preprod anchor hash uses SHA-256 as a stand-in; mainnet anchors MUST
  use blake2b-256 per CIP-100/CIP-108.

## Upstream

- Contracts: [SundaeSwap-finance/treasury-funds](https://github.com/SundaeSwap-finance/treasury-funds)
- Audits (in that repo): TxPipe, MLabs
