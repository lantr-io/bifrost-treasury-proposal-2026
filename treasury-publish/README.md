# treasury-publish

Scalus 0.18.2 reimplementation of the **Phase-1** treasury-withdrawal *publishing*
tooling (gen-keys → init-registry → register-scripts → build-gov-action),
replacing the corresponding bun/TypeScript scripts. Style follows
`recover-deposits/` and `m5-withdraw/`: a self-contained scala-cli project run
with `cardano-cli`-free Blaze-equivalent transaction building.

Phase 2 (disbursements / vendor-contract management — `fund-vendor`,
`vendor-withdraw`) is **not** included. The CIP-100 metadata **anchor** pipeline
(`extract-pieces` / `build-anchor` / `sign-anchor` / `pin`) stays in **bun** —
neither Scalus nor bloxbean ships a JSON-LD URDNA2015 canonicalizer.
`gov` consumes the bun-produced `gov/anchor.<net>.json` + `gov/pinned.json`.

Design + spec: `../docs/superpowers/specs/2026-06-27-scalus-treasury-withdrawal-publishing-design.md`.

## What it does (no contract reimplementation)

The audited SundaeSwap `treasury-funds` blueprint (`plutus.json`, vendored here)
is loaded with Scalus's CIP-57 `Blueprint`; parameters are applied with the UPLC
engine (`Program $ Data`) to reproduce the registry / treasury / vendor script
identities **byte-for-byte** vs the TypeScript package. That parity is enforced
by the test suite (oracle: `../scripts/parity-oracle.ts`).

## Run

Prerequisites (same as `recover-deposits`):
- `keys/admin.{skey,vkey,addr}`, `keys/admin.stake.{skey,vkey,addr}` — produced
  by `genKeys` (below), funded on the target testnet faucet.
- `BLOCKFROST_PROJECT_ID` (network-scoped) in the environment or `.env`.
- Run from the **repo root** (paths to `keys/`, `deployment/`, `gov/`,
  `treasury-publish/plutus.json` are resolved relative to the cwd).

All tools default to **dry-run** (build + sign + print; no broadcast). Add
`--submit` to broadcast. Network via `--network preview|preprod|mainnet` (or
`NETWORK`; default `preview`). Mainnet params are an intentional not-runnable
placeholder.

```sh
# 1. operator payment + stake keys (idempotent; board keys are not generated)
scala-cli run treasury-publish --main-class treasurypublish.genKeys

# 2. mint the registry NFT + publish the registry datum
scala-cli run treasury-publish --main-class treasurypublish.init     -- --network preprod
scala-cli run treasury-publish --main-class treasurypublish.init     -- --network preprod --submit

# 3. register treasury+vendor stake creds (vote -> AlwaysAbstain) + admin stake
scala-cli run treasury-publish --main-class treasurypublish.register -- --network preprod --submit

# 4. build/submit the treasuryWithdrawal governance action
#    (requires gov/anchor.<net>.json + gov/pinned.json from the bun anchor pipeline)
scala-cli run treasury-publish --main-class treasurypublish.gov      -- --network preprod --submit
```

`init --submit` writes `deployment/<net>.json` (same schema as the bun tooling);
`register`/`gov` read it and record their tx hashes back into it.

## Test

```sh
scala-cli test treasury-publish      # hash + datum parity vs the TS oracle
```

To regenerate the parity fixture after a blueprint or params change:

```sh
bun scripts/parity-oracle.ts > treasury-publish/fixtures/parity-preprod.json
```
