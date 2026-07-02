# bifrost-treasury

Operational setup for the Cardano treasury withdrawal funding **Phase 1 of the
Bifrost Bridge** — a Bitcoin↔Cardano bridge delivered jointly by
[Lantr Engineering](https://lantr.io/) and [FluidTokens](https://fluidtokens.com/).

> **Status:** preparing the on-chain submission. Near-term goal is to publish
> the treasury-withdrawal governance action on the **preview** testnet; the
> proposal at [`docs/proposal.md`](docs/proposal.md) is synced from
> [HackMD](https://hackmd.io/@lantr/bifrost-bridge-2026). Funding execution and
> mainnet submission are deferred.

## What this repo is

A codebase that parameterizes and drives the audited
[SundaeSwap `treasury-funds`](https://github.com/SundaeSwap-finance/treasury-contracts)
Aiken contracts to:

1. mint a one-shot registry NFT pinning our treasury+vendor script hashes;
2. register both scripts as DReps and delegate them to `AlwaysAbstain`
   (constitutional requirement — withdrawn ADA cannot vote);
3. emit a CIP-108 governance-action JSON to be submitted via `cardano-cli`;
4. (deferred, post-ratification) withdraw funds, fund the vendor contract with
   the development milestone schedule, disburse fixed costs, and claim matured
   payouts.

This repo does **not** contain contract code. The contracts are upstream and
audited (TxPipe + MLabs); we consume them via the
[`@sundaeswap/treasury-funds`](https://www.npmjs.com/package/@sundaeswap/treasury-funds)
npm package and a parallel Scala (scalus) reimplementation of the parameter
application. Both are kept byte-for-byte in parity.

## Two pipelines, one result

| Pipeline | Location | Role |
|---|---|---|
| Scala / scalus | `treasury-publish/` | primary execution path |
| bun / TypeScript | `scripts/`, `params/` | cross-check oracle |

Parity (registry policy, treasury/vendor script hashes, registry datum,
gov-action JSON) is enforced offline by `treasury-publish/parity.test.scala`
(against a fixture from `scripts/parity-oracle.ts`) and live by
`scripts/compare-parity-preview.sh`. Any config change that moves a script hash
must be mirrored in both and re-verified.

## Proposal & funding shape

- **Withdrawal:** ₳12,332,031 (Phase 1 total incl. 10% refundable contingency;
  net committed ₳11,210,938 ≈ $1,793,750 @ $0.16/ADA).
- **Term:** 9 months (Jul 2026 – Mar 2027). T_max **2027-07-31**;
  vendor expiration 2027-08-30.
- **Two joint vendors:** Lantr (also the operator, K_op) + FluidTokens, no
  budget split. Both must co-sign every disbursement and every vendor claim.
- **Hybrid release:** only Core development (₳3,937,500) is locked in the vendor
  contract as four equal ₳984,375 payouts — M0 (upfront advance) + M1/M2/M3 at
  the quarter-ends. Audits/PM/ecosystem/legal are disbursed on invoice; the
  contingency stays at the treasury contract in ADA and is swept back if unused.

Full design + phasing:
[`docs/superpowers/specs/2026-07-02-bifrost-treasury-design.md`](docs/superpowers/specs/2026-07-02-bifrost-treasury-design.md).

## Permission topology

| Action | Required signers |
|---|---|
| `treasury.reorganize` | operator (K_op) |
| `treasury.sweep` | 1-of-3 board |
| `treasury.disburse` | both vendors (Lantr + FluidTokens) + 1-of-3 board |
| `treasury.fund` | 2-of-3 board (+ vendor consent, enforced by the contract) |
| `vendor.pause` | 1-of-3 board |
| `vendor.resume` | 2-of-3 board |
| `vendor.modify` | 2-of-3 board (+ vendor consent) |
| vendor claim (`withdraw`) | both vendors (2-of-2) |

Because Lantr and FluidTokens are two *independent* organizations that both
sign every disburse, "both vendors + 1 board" is a stronger practical control
than a single-operator + board-majority setup. 2-of-3 board is reserved for the
structural actions (fund/modify/resume).

## Repo layout

```
docs/proposal.md            CIP-108 source of truth (synced from HackMD)
docs/superpowers/specs/     design docs
Plan.md                     operator runbook + topology rationale
gov/                        anchor JSON + gov-action outputs (regenerated)
params/{common,preprod,preview,mainnet}.ts
                            bun network config + permission topology
scripts/01..06-*.ts         bun operator entry points (init, register, gov,
                            withdraw, fund, vendor-withdraw)
scripts/{build,sign}-anchor.ts, pin.ts, extract-pieces.ts
                            CIP-108 anchor pipeline
scripts/parity-oracle.ts    deterministic oracle for the scala parity gate
treasury-publish/           Scala/scalus pipeline (init, register, gov) + parity
recover-deposits/           gov-action deposit recovery helper
contracts/treasury-contracts/
                            audited Aiken contracts (submodule, reference)
flake.nix                   pinned dev shell (bun, cardano-cli, scala-cli, …)
```

## Quick start

Requires [nix](https://nixos.org/download.html) with flakes enabled:

```sh
git submodule update --init
nix develop                  # or `direnv allow`
bun install                  # postinstall patches libsodium + the sundae trace bug
bun run test                 # bun params + lib tests
bun run typecheck
scala-cli test treasury-publish   # scala tests + bun⇄scala parity gate
```

Operator scripts default to `--dry-run` (build the tx, print a summary, do not
submit). Submission requires the explicit `--submit` flag. The full preview
runbook lives in [Plan.md](Plan.md).

## Trust model

- We trust the SundaeSwap `treasury-funds` contracts (TxPipe + MLabs audited).
  We do **not** re-audit, port, or fork them.
- The contract submodule is pinned at the audited commit so the audit reports
  apply directly.
- The on-chain CIP-100 anchor hash is `blake2b-256` over the bytes of the
  anchor JSON, built reproducibly from [`docs/proposal.md`](docs/proposal.md) —
  re-run `bun run build-anchor` to verify a published anchor.
- The two pipelines are independent implementations of the same parameter
  application; their agreement (parity gate) is an extra check that neither has
  a parameterization bug before anything reaches mainnet.

## Cross-repo links

- Bifrost Bridge: [github.com/FluidTokens/ft-bifrost-bridge](https://github.com/FluidTokens/ft-bifrost-bridge)
- Lantr Engineering: [lantr.io](https://lantr.io/) · FluidTokens: [fluidtokens.com](https://fluidtokens.com/)
- SundaeSwap audited contracts:
  [github.com/SundaeSwap-finance/treasury-contracts](https://github.com/SundaeSwap-finance/treasury-contracts)

## License

Licensed under the [Apache License, Version 2.0](LICENSE).

Copyright 2026 Lantr Engineering.
