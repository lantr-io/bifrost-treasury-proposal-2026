# Scalus reimplementation of treasury-withdrawal publishing (Phase 1)

**Date:** 2026-06-27
**Status:** Approved, in implementation

## Goal

Reimplement the Phase-1 bun/TypeScript operational scripts as **Scalus 0.18.2**
scala-cli tooling in this repo, in the style of `recover-deposits/` and
`m5-withdraw/`. Phase 1 = everything needed to stand up and **publish** the
`treasuryWithdrawal` governance action. Disbursements (treasury → vendor) and
vendor-contract management are explicitly **Phase 2**.

This is an operational-tooling reimplementation. It does **not** port or
reimplement the SundaeSwap `treasury-funds` contracts; it loads their audited
Aiken-compiled blueprint and applies parameters with Scalus's UPLC engine.

## Scope

In scope (bun script → new Scala main):

| bun script | Scala main | function |
|---|---|---|
| `gen-keys.ts` | `GenKeys` | admin payment + stake raw-hex ed25519 keys + `.addr` files |
| `01-init-registry.ts` | `InitRegistry` | mint one-shot REGISTRY NFT; publish registry datum |
| `02-register-scripts.ts` | `RegisterScripts` | register treasury + vendor stake creds (vote → AlwaysAbstain) + admin stake cred |
| `03-build-gov-action.ts` | `BuildGovAction` | build / submit the `treasuryWithdrawal` governance action |

Out of scope (Phase 2 or stays in bun):

- `04-withdraw`, `05-fund-vendor`, `06-vendor-withdraw` — Phase 2.
- **Anchor pipeline** (`extract-pieces`, `build-anchor`, `sign-anchor`, `pin`)
  **stays in bun**. Neither Scalus nor bloxbean's cardano-client-lib has a
  CIP-100 / JSON-LD URDNA2015 canonicalizer (verified: bloxbean
  `cardano-client-governance` only ships DRep/committee key helpers + `GovId`).
  `BuildGovAction` *consumes* the bun-produced `gov/anchor.<net>.json` (bytes →
  blake2b-256 = `dataHash`) and the pinned CID from `gov/pinned.json`
  (→ `ipfs://<cid>` anchor URL), matching `03`'s anchor semantics.

## Decisions (locked)

1. **Phase 1 = standup → publish.** `GenKeys`, `InitRegistry`, `RegisterScripts`,
   `BuildGovAction`. Not `04-withdraw`.
2. **Contracts via vendored compiled blueprint.** Copy the audited `plutus.json`
   from `treasury-contracts` into the project; load with `Blueprint.fromJson`;
   apply params with Scalus UPLC (`program $ data`). No bun/TS at runtime, no
   contract reimplementation.
3. **Local scala-cli only for now.** Single scala-cli project folder in this
   repo (not the scalus monorepo). Upstreaming a reusable library/CLI to
   `scalus` is deferred.
4. **Anchor stays in bun** (see Scope). Revisit a Scala CIP-100 implementation
   later if/when a canonicalizer is available.
5. **Transaction building uses the fluent `scalus.cardano.txbuilder.TxBuilder`**
   (the API used by `recover-deposits`/`m5-withdraw`), not the lower-level
   step-based `TransactionBuilder`.

## Architecture

### Project layout

One scala-cli project folder, `treasury-publish/`, with shared modules and one
runnable `@main` per command (selected via `scala-cli run . --main-class …`):

```
treasury-publish/
  project.scala         // //> using scala 3.3.x; dep scalus-cardano-ledger:0.18.2; shared opts
  Config.scala          // port of params/common.ts + preprod/preview/mainnet
  ContractData.scala    // Data encoders: OutputReference, MultisigScript, Treasury/VendorConfiguration
  Blueprint.scala       // load vendored plutus.json; apply params; compute script hashes
  Deployment.scala      // read/write deployment/<net>.json (SAME format as bun)
  Chain.scala           // keys, address derivation/cross-check, provider, signer (ported from recover-deposits)
  GenKeys.scala
  InitRegistry.scala
  RegisterScripts.scala
  BuildGovAction.scala
  plutus.json           // vendored audited blueprint (copied from ../treasury-contracts/plutus.json)
```

Conventions preserved from the bun tooling:

- **Default dry-run**; `--submit` to broadcast.
- `--network preview|preprod|mainnet`; mainnet guarded (placeholder params,
  not runnable). Blockfrost key prefix checked against `--network` (as in
  `recover-deposits`).
- Reads/writes the **same `deployment/<net>.json`** schema as the bun scripts,
  so bun and Scala tooling interoperate during the transition.
- `BLOCKFROST_PROJECT_ID` from env or `../.env` / `.env` (as in `recover-deposits`).

### Contract bytecode core (highest-risk component)

The three on-chain script identities are produced by parameter application over
the vendored blueprint:

- **registry policy** = hash of `oneshot.oneshot.mint` applied with
  `utxo_ref = Constr(0, [B(txId), I(outputIndex)])` (the seed UTxO).
- **treasury script** = hash of `treasury.treasury.spend` applied with
  `config = TreasuryConfiguration` Data.
- **vendor script** = hash of `vendor.vendor.spend` applied with
  `config = VendorConfiguration` Data.

`plutus.json` is the **production (stripped)** blueprint — vendor validator is
7,873 bytes (the ~17 KB traced variant is the bug the bun `patch-sundae.ts`
worked around; the blueprint here is already the right one). All handlers of a
multi-validator share one `compiledCode`, so `treasury.treasury.spend` is the
single treasury script.

`Data` encoders for `MultisigScript` (Signature / AllOf / AtLeast), the
permission groups, `TreasuryConfiguration`, `VendorConfiguration`, and
`OutputReference` are derived from the blueprint's `definitions` (constructor
indices + field order read from the schema, **not guessed**), so they encode
byte-identically to Aiken / the TS package.

`Script.PlutusV3(appliedCborBytes).scriptHash` computes the hash (version-byte
prefix handled internally by Scalus).

### Transaction building (fluent `TxBuilder`)

`TxBuilder.complete(provider, sponsor)` auto-selects inputs, collateral (when
redeemers are present), change, balances, and **evaluates Plutus scripts with
Scalus's own CEK machine** — so the entire bun `SKIP_EVAL` / `manual-evaluator`
workaround (broken Blockfrost preview eval) disappears.

- **InitRegistry:**
  `TxBuilder(env).spend(seedUtxo).mint(registryPolicy, REGISTRY→1, Data.unit)`
  with the oneshot script attached, `.payTo(registryScriptAddr, value,
  registryDatum)`, `.requireSignature(adminPkh)`, `.complete(provider, adminAddr)`,
  `.sign(signer)`. Seed UTxO = first admin wallet UTxO (recorded in deployment).
- **RegisterScripts:** for treasury and vendor script stake creds,
  `.registerStake(scriptStakeAddr, TwoArgumentPlutusScriptWitness(PlutusScriptValue(script), Data.unit))`
  and `.delegateVoteToDRep(scriptStakeAddr, DRep.AlwaysAbstain,
  TwoArgumentPlutusScriptWitness(...))`. Admin keyed stake cred via
  `.registerStake(adminStakeAddr)` **only if not already registered** (Blockfrost
  `registered` check, mirroring `02`'s idempotency). `.requireSignature(adminPkh)`.
- **BuildGovAction:** `TxBuilder` has no fluent proposal method, so inject the
  step (public `addSteps`), which the pipeline auto-wires (guardrails Proposing
  redeemer + script witness):
  ```scala
  TxBuilder(env)
    .addSteps(TransactionBuilderStep.SubmitProposal(
      ProposalProcedure(deposit, depositReturnReward,
        GovAction.TreasuryWithdrawals(Map(treasuryReward -> amount), Some(guardrailsHash)),
        anchor),
      TwoArgumentPlutusScriptWitness(ScriptSource.PlutusScriptValue(guardrailsScript), Data.unit)))
    .requireSignature(adminPkh)
    .complete(provider, adminAddr).await().sign(signer)
  ```
  Guardrails script hash (preprod/preview/mainnet genesis default):
  `fa24fb305126805cf2164c161d852a0e7330cf988f1fe558cf7d4a64`; CBOR fetched from
  Blockfrost `/scripts/<hash>/cbor` and loaded as `Script.PlutusV3`. Deposit read
  live from protocol params. Deposit-return reward = admin stake cred, rebuilt
  for the resolved network (never read from a testnet `.addr` file).
  *Optional upstream follow-up:* add a `.submitProposal(...)` convenience to
  Scalus's `TxBuilder` so the escape hatch is unnecessary.

### Keys / provider / anchor inputs

Ported from `recover-deposits`: raw-hex ed25519 keys under `keys/`, address
derivation (`priv → pub → blake2b_224 → address`) + cross-check of `.addr`
files by key hash, `BlockfrostProvider.{preview,preprod,mainnet}`,
`TransactionSigner`, `--network`-vs-key-prefix guard, `showDetailed` dump,
write signed CBOR hex out.

`GenKeys` writes `keys/admin.{skey,vkey,addr}` and
`keys/admin.stake.{skey,vkey,addr}` in the exact raw-hex formats that
`recover-deposits` and the bun scripts already consume.

## Testing

- **Hash-parity gate (must pass):** for a fixed seed UTxO + `preprodRawConfig`,
  Scala-computed `{registryPolicy, treasuryHash, vendorHash}` must equal a
  deterministic oracle. Oracle = a small no-network TS snippet that calls
  `OneshotOneshotMint(seed, true)` + `Utils.loadScripts(..., true)` and prints
  the three hashes for the same fixed seed. No tx is trusted until hashes match.
- **Data-encoder round-trip** against the blueprint `definitions` (constructor
  indices / field order).
- **Dry-run parity:** each main runs dry-run on preprod and prints a tx whose
  witnesses/outputs/certs match the corresponding bun script's dry-run summary.
- Mainnet stays not-runnable (placeholder params).

## Risks

- **Hash parity is the make-or-break.** If Scala-applied params don't reproduce
  the TS hashes, registry/treasury/vendor identities diverge and nothing
  downstream works. Mitigated by the parity gate above before any tx is built.
- **Proposal escape hatch.** Relies on the public `addSteps` + the pipeline's
  `SubmitProposal` handling. Covered by a dry-run that asserts the guardrails
  script witness + Proposing redeemer are present.
- **Anchor stays cross-language.** The bun anchor pipeline remains a prerequisite
  for `BuildGovAction`. Documented; not a regression.

## Out of scope / future

- Phase 2: `04-withdraw`, `05-fund-vendor`, `06-vendor-withdraw`.
- Upstreaming a reusable governance/treasury toolkit (library + CLI) into the
  `scalus` monorepo (candidate: new `scalus-cardano-governance` module or
  extend `scalus-cardano-ledger`).
- A Scala-native CIP-100 anchor implementation (needs a JSON-LD URDNA2015
  canonicalizer).
