# Bifrost Treasury — Preview End-to-End Plan

Goal: publish the Bifrost Bridge treasury-withdrawal governance action on the
**preview** testnet, proving the full upstream-facing pipeline (anchor format,
gov-action submission, deposit mechanics) before mainnet. The contract-validator
pieces (withdraw → fund → milestone maturation → vendor claim) only run after
the gov action ratifies and are **deferred** — see the design doc's Scope &
phasing.

Every deterministic artifact is produced by **both** pipelines (scala
`treasury-publish/` primary, bun `scripts/` oracle) and checked for parity.

## Confirmed parameters (HackMD `@lantr/bifrost-bridge-2026`)

- **Total withdrawal**: ₳12,332,031 (Phase 1 total incl. 10% refundable
  contingency ₳1,121,093; net committed ₳11,210,938).
- **`treasury.expiration` (T_max)**: `2027-07-31T00:00:00Z` — Q1 2027 delivery
  + 4-month buffer.
- **`vendor.expiration`**: T_max + 30 days = `2027-08-30T00:00:00Z`.
- **`payout_upperbound`**: T_max — milestones set at fund time must mature on or
  before this.

Baked into `params/{preprod,preview}.ts` and `Config.{preprod,preview}` (scala).
`params/mainnet.ts` + `Config.mainnet` carry the same values with the mainnet
K_op address, but mainnet submission is deferred.

### Identities & topology (implemented, verified in parity)

| Role | Identity | Pubkey hash |
|---|---|---|
| `K_op` | Lantr (operator + Lantr vendor signer) | `9edd850b20f4b20fc4a528bb4fcff0ca198470d224ab7d776b0452e3` |
| vendor | FluidTokens | `1c471b31ea0b04c652bd8f76b239aea5f57139bdc5a2b28ab1e69175` |
| `K_1` | Matthias Benkort (Cardano Foundation) | `7095faf3d48d582fbae8b3f2e726670d7a35e2400c783d992bbdeffb` |
| `K_2` | Chris Gianelloni (Blink Labs) | `058a5ab0c66647dcce82d7244f80bfea41ba76c7c9ccaf86a41b00fe` |
| `K_3` | Riley Kilgore (IOG) | `fe0921cfa53b2deef20f185258f8bc6e127ab6fa1084e62f0830ddef` |

| Action | Multisig |
|---|---|
| `treasury.reorganize` | `K_op` |
| `treasury.sweep` | `AtLeast(1, board)` |
| `treasury.disburse` | `AllOf[Lantr, FluidTokens, AtLeast(1, board)]` |
| `treasury.fund` | `AtLeast(2, board)` (+ vendor consent, enforced by `fund.ak`) |
| `vendor.pause` | `AtLeast(1, board)` |
| `vendor.resume` | `AtLeast(2, board)` |
| `vendor.modify` | `AtLeast(2, board)` (+ vendor consent) |
| vendor claim | `AllOf[Lantr, FluidTokens]` (2-of-2, set in VendorDatum at fund time) |

> **Before the immutable mint:** obtain FluidTokens' payment vkey + a
> proof-of-control signature and re-derive the pkh yourself. A wrong pkh bakes
> into the treasury/vendor script hashes permanently.

---

## Stage 1 — Anchor preparation

### 1.0 Pinning strategy

Voters reading the anchor through gov.tools can click any entry in
`body.references`. If the proposal has annexes, splitting it into
individually-addressable IPFS objects gives stable per-annex CIDs plus a single
`proposal-main` CID. The full proposal text still lives inside the anchor's
`body.rationale`, so the anchor stays self-contained.

`docs/proposal.md` is the canonical HackMD-mirrored full text and the input
`build-anchor` reads to populate `body.rationale`. Any split files are derived
from it via `extract-pieces` (deterministic); re-run before each pin batch.

### 1.1 Pinning credentials

Edit `.env` (copy from `.env.example`):

```
PINATA_JWT=…                # https://app.pinata.cloud/developers/api-keys
BLOCKFROST_IPFS_PROJECT_ID= # separate from BLOCKFROST_PROJECT_ID (chain)
```

At least one; both gives redundancy.

### 1.2 Sync + (optional) extract

```
curl https://hackmd.io/@lantr/bifrost-bridge-2026/download -o docs/proposal.md
bun run extract-pieces        # only if the proposal has annexes
```

### 1.3 Pin the pieces

```
bun run pin docs/proposal-main.md --role proposal-main --name bifrost-proposal-main
bun run pin docs/annex-N.md       --role annexN        --name bifrost-annex-N     # per annex, if any
```

Each pin verifies public-gateway retrievability before recording its CID into
`gov/pinned.json`.

### 1.4 Build the anchor

```
bun run build-anchor -- --network preview
```

Reads the CIDs from `gov/pinned.json` and emits `gov/anchor.preview.json` with
the canonical CIP-100/CIP-108 nested `@context`, `body.rationale` = full
proposal text, `body.references` = `ipfs://` links + external links, and an
`authors` array (Lantr Engineering) with blank witness placeholders. Validates
against `schemas/cip-0108.common.schema.json` before writing.

> Watch the 80-char `body.title` cap and escape bare `$` (the Bifrost proposal
> uses `$…$` LaTeX heavily). See CLAUDE.md gotchas.

### 1.5 Sign the anchor

```
bun run sign-anchor gov/anchor.preview.json
```

URDNA2015-canonicalizes `{@context, body}`, blake2b-256 hashes it, ed25519-signs
with `keys/admin.skey`, writes `authors[0].witness`. Re-validates.

### 1.6 Pin the anchor

```
bun run pin gov/anchor.preview.json --role anchor --name bifrost-anchor-preview
```

The CID becomes the anchor URL in the gov action (emitted as an HTTPS gateway
URL; see CLAUDE.md gotchas on `ipfs://` vs `https://`).

---

## Stage 2 — Operator wallet

- [x] `bun run gen-keys` — K_op generated (`keys/admin.*`).
- [ ] Confirm `keys/admin.addr` is a base address (`addr_test1q…`) and matches
      `params/preprod.ts:adminAddress` (it does — pkh `9edd850b…`).
- [ ] Fund the admin base address from the preview faucet
      (https://docs.cardano.org/cardano-testnets/tools/faucet). Read the deposit
      live — on **preview** it's ~1,000 tADA and lifetime is 30 epochs (do NOT
      hardcode 100,000):
      ```
      cardano-cli conway query gov-state --testnet-magic 2 \
        | jq '.currentPParams.govActionDeposit, .currentPParams.govActionLifetime'
      ```
      Pull `govActionDeposit + ~50 tADA` for fees & minUTxOs.
- [ ] Verify:
      `cardano-cli conway query utxo --address $(cat keys/admin.addr) --testnet-magic 2`.

---

## Stage 3 — Init & register

- [ ] `bun run init --submit` (or `scala-cli run treasury-publish --main-class
      treasurypublish.init -- --network preview --submit`). Mints the one-shot
      registry NFT; capture txhash from `deployment/preview.json:txs.initRegistry`.
- [ ] `bun run register --submit`. Registers three stake credentials in one tx:
      treasury + vendor (both vote-delegated to AlwaysAbstain), and the admin's
      personal stake key (no delegation — so the gov-action deposit refund lands
      in a usable reward account).
- [ ] `bun run gov` (dry-run) to emit `gov/preview-withdrawal.json`. Sanity-check
      the printed anchor hash matches `b2sum -l 256 gov/anchor.preview.json`.
- [ ] `scripts/compare-parity-preview.sh <seed#ix> preview` — assert bun ⇄ scala
      parity on registry policy, treasury/vendor hashes, reward accounts, and the
      gov-action JSON before submitting.

---

## Stage 4 — Gov-action submission

- [ ] `bun run gov --submit`. Builds and broadcasts the
      `treasury_withdrawals_action` via Blaze + Blockfrost. The script:
      - derives the funds-receiving stake address from
        `state.treasuryScriptHashHex`;
      - fetches the live `gov_action_deposit` from protocol params;
      - sets `policyHash` to the constitution's guardrails hash (query via
        `cardano-cli conway query constitution --testnet-magic 2`);
      - manually wires the Proposing redeemer (`Void`) + guardrails script
        witness (Blaze's `addProposal()` doesn't — see CLAUDE.md gotchas);
      - signs with `keys/admin.skey`, submits, records the tx hash.
- [ ] Verify on https://gov.tools/?network=preview that the action lists with
      our anchor URL + hash and renders correctly (title/abstract/rationale).
      Cross-check via Koios `/proposal_list` (`meta_json`) — cexplorer's
      "invalid metadata" badge is ~10-15% noise.

**Two outcomes:**
- **Ratification** → action enacts, treasury reward account credited → the
  deferred funding stage becomes exercisable.
- **Expiry** → the deposit lands in the admin reward account (Stage 3); recover
  it with a `Withdrawals` tx signed by `keys/admin.stake.skey` (or via
  `recover-deposits/`).

---

## Stage 5 — Funding execution (DEFERRED, post-ratification)

Not part of the near-term preview scope. When designed, this covers:

- `withdraw` — pull the ratified amount into a UTxO at the treasury script.
- `fund` — lock Core development (₳3,937,500) at the vendor script as four
  ₳984,375 payouts: M0 (matures at funding) + M1/M2/M3 at quarter-ends, gated by
  the 2-of-2 vendor multisig. **Wire `05-fund-vendor.ts`** (currently a
  `TODO(milestone-schedule)` stub) first.
- `disburse` — pay audits/PM/ecosystem/legal on invoice (both vendors + 1 board).
  **A disburse script does not exist yet** — to be added.
- `vendor-withdraw` — vendors claim matured milestones (2-of-2).
- **USDC conversion** — convert the committed spend to USDC before funding;
  contingency stays in ADA (see design doc §5 for the two contract constraints).
- Multi-key signing (both vendors, board members) — currently only K_op signing
  is wired; `fund`/`disburse`/`vendor.modify`/vendor `withdraw` need the
  additional signers accumulated.
- `07-sweep.ts` (post-expiration sweep back to the Cardano treasury) — missing.

---

## Stage 6 — Mainnet readiness

Mainnet promotion requires the preview upstream-facing flow green: gov action on
chain with correct anchor URL + hash, rendered in gov.tools, deposit handled
(ratified with funds received, or expired with deposit recovered). Then fill in
mainnet specifics: re-verify FluidTokens key-of-control, re-read live mainnet
gov-action params (deposit 100,000 ADA), and submit via the explicitly-imported
`params/mainnet.ts` / `Config.mainnet` path.
