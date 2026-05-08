# Treasury Withdrawal Proposal — Preprod End-to-End Plan

Goal: prove the full proposal pipeline on preprod before mainnet. The
upstream-facing pieces (anchor format, gov-action submission, deposit
mechanics) only exist on a real network, so they run against preprod. The
contract-validator pieces (treasury withdraw → vendor fund → milestone
maturation → vendor claim) cannot be reliably exercised on preprod because
ratification depends on DRep activity we don't control; those run on Yaci
DevKit in parallel.

**Two parallel tracks, not a fallback chain:**

| Track | Network | Scope                                                          |
|-------|---------|----------------------------------------------------------------|
| A     | preprod | anchor pin, init, register, gov-action submission, observe     |
| B     | Yaci    | init, register, hand-fund treasury, withdraw, fund, vendor-withdraw |

Mainnet readiness = both tracks green.

## Confirmed parameters (from HackMD proposal, 2026-05-08)

- **Total withdrawal**: ₳8,503,000 (incl. 10% refundable contingency).
  Treasury holds the contingency; only base ₳7,730,000 is locked into
  vendor milestones at fund-vendor time. Contingency is later disbursed
  via direct `treasury.disburse`, additional `treasury.fund`, or
  `vendor.modify` (all require operator + board co-sign).
- **`treasury.expiration` (T_max)**: `2027-09-01T00:00:00Z` — end of
  12-month delivery (May 2027) + 3-month contingency window.
- **`vendor.expiration`**: T_max + 30 days = `2027-10-01T00:00:00Z`
  (grace for late Modify cleanup).
- **`payout_upperbound`**: T_max — milestones picked at fund-vendor time
  must mature on or before this.

These values are baked into `params/preprod.ts`. Same shape will go into
`params/mainnet.ts` once the multisig topology and operator/board pkhs
are filled in.

---

## Stage 1 — Anchor preparation (Track A)

### 1.0 Pinning strategy

Voters reading the anchor through gov.tools can click any entry in
`body.references`. Splitting the proposal into individually-addressable
IPFS objects gives them: (a) stable per-annex CIDs that don't change if
the parent proposal text is reorganized; (b) the option to pull a
specific annex without downloading the full document; (c) a single
`proposal-main` CID for readers who want only the main argument.

The full proposal text (with annexes inline) still lives inside the
anchor's `body.rationale`, so the anchor remains self-contained — the
per-piece CIDs are *additional* references, not replacements.

Files to pin (one CID each):

| File                     | Role           | Source                              |
|--------------------------|----------------|-------------------------------------|
| `docs/proposal-main.md`  | `proposal-main`| proposal.md minus the annex bodies  |
| `docs/annex-1.md`        | `annex1`       | "### Annex 1: Detailed Scope …"     |
| `docs/annex-2.md`        | `annex2`       | "### Annex 2: Product Development …"|
| `docs/annex-3.md`        | `annex3`       | "### Annex 3: 2025 Retrospective"   |
| `gov/anchor.preprod.json`| `anchor`       | built by `build-anchor` (final URL) |

(Annex 4 in `proposal.md` is currently a `<!-- … -->` placeholder; skip.)

`docs/proposal.md` stays as the canonical HackMD-mirrored full text and
is the input that `build-anchor` reads to populate `body.rationale`. The
four split files are derived from it via a deterministic extraction
step (1.2). Drift between them is impossible as long as you re-run the
extract step before each pin batch.

### 1.1 Set up pinning credentials

Edit `.env` (copy from `.env.example` if missing):

```
PINATA_JWT=…                # Pinata JWT, https://app.pinata.cloud/developers/api-keys
BLOCKFROST_IPFS_PROJECT_ID= # separate from BLOCKFROST_PROJECT_ID (chain)
```

At least one is required. Setting both gets redundancy.

### 1.2 Extract the split files

```
bun run extract-pieces
```

Reads `docs/proposal.md` and writes:
- `docs/proposal-main.md` (everything outside the annex section)
- `docs/annex-1.md`, `docs/annex-2.md`, `docs/annex-3.md`

Idempotent. Re-run after any `proposal.md` edit so the split files stay
in sync. Files are committed to git so the IPFS-pinned bytes are
auditable from the repo.

### 1.3 Pin proposal-main and each annex

```
bun run pin docs/proposal-main.md --role proposal-main --name scalus-treasury-proposal-main
bun run pin docs/annex-1.md       --role annex1        --name scalus-treasury-annex-1-scope
bun run pin docs/annex-2.md       --role annex2        --name scalus-treasury-annex-2-methodology
bun run pin docs/annex-3.md       --role annex3        --name scalus-treasury-annex-3-retrospective
```

Each pin verifies public-gateway retrievability before recording its
CID into `gov/pinned.json`.

### 1.4 Build the anchor

```
bun run build-anchor -- --network preprod
```

Reads all four CIDs from `gov/pinned.json` and emits
`gov/anchor.preprod.json` with:
- `body.rationale` = full proposal text (annexes inline) — voters see
  this rendered in their wallet/gov.tools UI without leaving the anchor.
- `body.references` = `ipfs://` link for `proposal-main` + one per annex,
  plus the existing external links (HackMD, Scalus, audits, etc).

Re-run after any of the underlying CIDs change — the on-chain hash
changes with it.

### 1.5 Pin the anchor

```
bun run pin gov/anchor.preprod.json --role anchor --name scalus-treasury-anchor-preprod
```

The resulting CID becomes `ANCHOR_URL` in the gov action.
`03-build-gov-action.ts` reads it from `gov/pinned.json` automatically.

---

## Stage 2 — Operator wallet (Track A)

- [ ] `bun run gen-keys` (idempotent — keep existing keys if present).
- [ ] Confirm `keys/admin.addr` is a base address (`addr_test1q…`,
      ~108 chars) and `keys/admin.stake.addr` is a stake address
      (`stake_test1u…`).
- [ ] **Confirm `params/preprod.ts:adminAddress` matches `keys/admin.addr`.**
      The committed value is the canonical preprod proposer; if you
      regenerate keys, edit `params/preprod.ts` (and the matching
      assertion in `params/preprod.test.ts`) to the new address.
      Mismatch will make `bun run init` sign with the new key while
      requiring the old pkh as a `--required-signer` — and fail.
      `ADMIN_ADDRESS_OVERRIDE` exists for Yaci devnet runs only (see
      Stage 5); avoid it on real preprod so config and signing key
      stay coupled in committed source.
- [ ] Fund admin address from preprod faucet
      (https://docs.cardano.org/cardano-testnets/tools/faucet). The
      gov-action deposit is a protocol parameter — query it before
      pulling funds:
      ```
      cardano-cli conway query gov-state --testnet-magic 1 \
        | jq '.currentPParams.govActionDeposit, .currentPParams.govActionLifetime'
      ```
      Pull at least `govActionDeposit + 50 tADA` for fees & minUTxOs. If
      a single faucet pull is capped, request elevated quota in Intersect
      Discord, or combine multiple addresses.
- [ ] Verify balance via
      `cardano-cli conway query utxo --address $(cat keys/admin.addr) --testnet-magic 1`.

---

## Stage 3 — Init & register scripts (Track A)

- [ ] `bun run init --submit`. Verify on Cardanoscan
      (https://preprod.cardanoscan.io/transaction/<txhash>) that the
      registry NFT is locked at the registry script address. Capture
      txhash from `deployment/preprod.json:txs.initRegistry`.
- [ ] `bun run register --submit`. Registers **three** stake credentials
      in one tx: treasury (vote-delegated to AlwaysAbstain), vendor
      (same), and the admin's personal stake key (no delegation —
      registered only so the gov-action deposit refund can land in a
      usable reward account when the action ratifies or expires).
      Verify all three exist:
      ```
      cardano-cli conway query stake-address-info \
        --address <treasuryReward> --testnet-magic 1
      cardano-cli conway query stake-address-info \
        --address $(cat keys/admin.stake.addr) --testnet-magic 1
      ```
- [ ] `bun run gov` to emit `gov/preprod-withdrawal.json` and the
      cardano-cli draft template. Sanity-check the printed hash matches
      blake2b-256 of `gov/anchor.preprod.json` (independent computation
      via `b2sum -l 256` or python `hashlib.blake2b`).

---

## Stage 4 — Gov-action submission (Track A)

- [ ] Build the action draft (template printed by `bun run gov`):
      ```
      cardano-cli conway governance action create-treasury-withdrawal \
        --testnet \
        --governance-action-deposit "$(cardano-cli conway query gov-state \
          --testnet-magic 1 | jq '.currentPParams.govActionDeposit')" \
        --deposit-return-stake-address "$(cat keys/admin.stake.addr)" \
        --anchor-url ipfs://<anchorCid> \
        --anchor-data-hash <blake2b256-hex> \
        --funds-receiving-stake-address <treasuryReward> \
        --transfer 8503000000000 \
        --out-file gov/action.draft
      ```
- [ ] Build a tx that includes the proposal:
      ```
      cardano-cli conway transaction build \
        --testnet-magic 1 \
        --tx-in <admin-utxo> \
        --change-address $(cat keys/admin.addr) \
        --proposal-file gov/action.draft \
        --out-file gov/action.tx
      ```
- [ ] Sign with `keys/admin.skey`, submit, capture tx hash and
      gov-action ID.
- [ ] Verify on https://preprod.cardanoscan.io/govactions and
      https://gov.tools/?network=preprod that the action is listed with
      our anchor URL and hash.
- [ ] Click through to the anchor URL in gov.tools to confirm the
      rendered proposal looks correct (title, abstract, motivation,
      rationale render in the UI).

**Stop point for Track A.** Whether the action ratifies depends on DRep
activity we don't drive. Optionally post in Intersect's voltaire-testnet
channel to nudge votes. If it expires (`govActionLifetime` epochs), the
~100k tADA deposit lands in the admin reward account (registered in
Stage 3) — recover it with a `Withdrawals` tx signed by
`keys/admin.stake.skey`.

---

## Stage 5 — Local end-to-end on Yaci DevKit (Track B)

The provider already supports Yaci via `BLOCKFROST_URL` +
`YACI_GENESIS_DIR` (see `scripts/lib/provider.ts:50-64`). Use Yaci to
exercise stages 6–7 against the real validators, with manually-injected
treasury funds (skipping the gov-action ratification path).

- [ ] Install Yaci DevKit (https://github.com/bloxbean/yaci-devkit).
- [ ] Start with Conway era enabled and short epoch length (~30s).
- [ ] In `.env` (or per-shell): set
      ```
      BLOCKFROST_URL=http://localhost:8080/api/v1/
      YACI_GENESIS_DIR=/path/to/yaci/genesis
      ADMIN_ADDRESS_OVERRIDE=<yaci-funded base address>
      ```
- [ ] Hand-fund the treasury script's *reward account* via Yaci's admin
      RPC (this is what a successful gov-action ratification would do on
      mainnet). Yaci's `yaci-cli` exposes a treasury-injection command;
      check current docs for exact name.
- [ ] Run `bun run init --submit` → `bun run register --submit` →
      `bun run withdraw --submit`.
- [ ] **Wire `05-fund-vendor.ts` schedule first** (see
      `TODO(milestone-schedule)` in that file), then
      `bun run fund --submit`.
- [ ] Wait until first milestone matures (Yaci can advance time by
      epoch-rolling so this isn't actually a 30-day wait).
- [ ] `bun run vendor-withdraw --submit`. Verify admin wallet received
      the first milestone payout.
- [ ] Wait until last milestone matures, run `vendor-withdraw` again to
      drain.
- [ ] Optionally test sweep-after-expiration (need `07-sweep.ts` —
      currently missing).

If anything fails at this stage, the failure is in our parameterization,
not the SundaeSwap contracts. Catalogue the bug, fix it, re-run from the
appropriate point.

---

## Stage 6 — Mainnet readiness signoff

Both tracks must be green before mainnet promotion. Specifically:

- Track A: gov-action visible on chain with correct anchor URL + hash;
  rendered correctly in gov.tools; either ratified-and-funds-received or
  cleanly expired-and-deposit-returned.
- Track B: full pipeline runs end-to-end on Yaci against the real
  validators with our parameterization. Vendor claim succeeds at exactly
  the maturation timestamp; rejected before.

Then proceed with the mainnet-specific work below (multisig topology,
final pkhs).

---

## Treasury Withdrawal Script Address (mainnet topology)

Single-scope deployment: one registry NFT, one `treasury.ak`, one
`vendor.ak`. `vendor.ak` is enabled but not exercised at setup — script
parameters (vendor permissions, vendor expiration) are committed at registry
mint; the per-Fund `vendor` multisig and milestone schedule are deferred
until an actual project requires milestone vesting.

### Roles

| Role  | Identity         | Pubkey hash |
|-------|------------------|-------------|
| `K_op`| Lantr (operator) | TODO        |
| `K_1` | KtorZ?           | TODO        |
| `K_2` | Chris?           | TODO        |
| `K_3` | Damian?          | TODO        |

Confirm each board member in writing before pinning pkhs. The operator key
`K_op` is held by Lantr.

### Permissions

Topology adapted from Dingo (operator + 3-member independent board). Every
permission that disposes of value — paying it out (`disburse`, `sweep`),
committing it to a milestone schedule (`fund`), or restructuring an
existing schedule (`modify`) — requires the operator (`K_op`) plus board
co-sign. Status-only changes (`pause`, `resume`) are board-only. No-flow
ops (`reorganize`) are operator-only.

| Action               | Multisig                                     | Plain English                |
|----------------------|----------------------------------------------|------------------------------|
| `treasury.reorganize`| `K_op`                                       | operator alone (no value leaves) |
| `treasury.disburse`  | `AllOf [K_op, AtLeast(1, [K_1, K_2, K_3])]`  | operator + 1-of-3 board      |
| `treasury.sweep`     | `AllOf [K_op, AtLeast(1, [K_1, K_2, K_3])]`  | operator + 1-of-3 board      |
| `treasury.fund`      | `AllOf [K_op, AtLeast(2, [K_1, K_2, K_3])]`  | operator + 2-of-3 board      |
| `vendor.pause`       | `AtLeast(1, [K_1, K_2, K_3])`                | 1-of-3 board (cheap to flag) |
| `vendor.resume`      | `AtLeast(2, [K_1, K_2, K_3])`                | 2-of-3 board (deliberate)    |
| `vendor.modify`      | `AllOf [K_op, AtLeast(2, [K_1, K_2, K_3])]`  | operator + 2-of-3 board      |

The `vendor` multisig (in `VendorDatum`, set per `Fund` call) is TBD per
project and decided at Fund time, not at registry mint.

#### Operational hardening

Every value-leaving permission (`disburse`, `sweep`, `modify`) requires at
least 2 distinct keys (operator + ≥1 board). Standard hardening still
applies:

- [ ] Each role's key held on a hardware wallet (no hot-key signing).
- [ ] Off-chain runbook: any disburse tx is announced in a pre-agreed
      channel with all 4 role-holders before signing; quiet submission
      flagged immediately as anomaly.
- [ ] Optional follow-up: add a `Script`-predicate cap on per-tx disburse
      amount (separate withdraw script gating large outflows behind a
      stricter board threshold).

### Time bounds (confirmed)

```
treasury.expiration  = 2027-09-01T00:00:00Z   // T_max = end of 12-month delivery + 3-month contingency
vendor.expiration    = 2027-10-01T00:00:00Z   // T_max + 30 days
payout_upperbound    = 2027-09-01T00:00:00Z   // = T_max
```

Already wired into `params/preprod.ts`. Same values copy into
`params/mainnet.ts` once the multisig topology lands.

### Implementation TODOs (mainnet)

- `params/common.ts`: extend `RawConfig` (or add a separate
  `MultisigRawConfig`) with `operatorAddress` + `boardAddresses: string[]`
  so production setup expresses the operator+3-board topology. Current
  model assumes a single admin.
- `params/mainnet.ts`: fill in once pkhs are confirmed. Time bounds are
  already known.
- `scripts/01-init-registry.ts`, `02-register-scripts.ts`,
  `05-fund-vendor.ts`, `06-vendor-withdraw.ts`: verify they accept the
  multi-key role model (currently hardcode `keys/admin.skey`).
- `scripts/05-fund-vendor.ts`: wire in the milestone schedule (vendor
  datum, set per Fund call). Currently a `TODO(milestone-schedule)`
  stub — non-runnable until decided.
- New `scripts/07-sweep.ts`: post-expiration sweep back to Cardano
  treasury (currently missing entirely).
