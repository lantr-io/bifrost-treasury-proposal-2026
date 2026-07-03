# CLAUDE.md

## What this repo is

Operational setup for the Cardano treasury withdrawal funding **Phase 1 of the
Bifrost Bridge** (Bitcoin↔Cardano bridge, delivered jointly by Lantr
Engineering and FluidTokens). Parameterizes and drives the audited SundaeSwap
`treasury-funds` contracts via their published TS package and a parallel Scala
(scalus) reimplementation. **Does not port or reimplement the contracts.**

Two pipelines drive the same audited contracts and must stay in lockstep:

- **Scala / scalus (`treasury-publish/`) — primary execution path.**
- **bun / TypeScript (`scripts/`, `params/`) — cross-check oracle.**

Both produce byte-identical deterministic artifacts (registry policy, treasury
/ vendor script hashes, registry datum, gov-action JSON). Parity is enforced
by `treasury-publish/parity.test.scala` (offline, against a fixture generated
by `scripts/parity-oracle.ts`) and `scripts/compare-parity-preview.sh` (live,
dry-run).

## Active proposal (as of 2026-07-02)

**Bifrost Bridge Phase 1** — "Mainnet Hardening & Audits" (HackMD
`@lantr/bifrost-bridge-2026`): **₳12,332,031** total incl. a 10% refundable
contingency (₳1,121,093); net committed ₳11,210,938 (≈ $1,793,750 @ $0.16/ADA).
9 months (Jul 2026 – Mar 2027). T_max **2027-07-31** (Q1 2027 delivery +
4-month buffer); vendor expiration = T_max + 30d = **2027-08-30**. Three
delivery milestones M1 (Q3'26) / M2 (Q4'26) / M3 (Q1'27).

Design + phasing: `docs/superpowers/specs/2026-07-02-bifrost-treasury-design.md`.

**Near-term scope: publish the treasury-withdrawal governance action on
Cardano *preview*.** That is the `init → register → gov → submit` path only.
Everything below the gov action is deferred:

- **Deferred (post-ratification):** funding execution (`fund` / `disburse` /
  `vendor-withdraw`), the USDC/OTC conversion, and mainnet submission.

**Fresh deployment** (reuses the existing board keys; a new T_max forces new
treasury/vendor script hashes). Identities:

- **K_op** — Lantr operator (also Lantr's vendor signer). Fresh key generated
  2026-07-02 (`keys/admin.*`), pkh `9edd850b20f4b20fc4a528bb4fcff0ca198470d224ab7d776b0452e3`.
  **Not** the old Scalus admin key.
- **FluidTokens** vendor pkh `1c471b31ea0b04c652bd8f76b239aea5f57139bdc5a2b28ab1e69175`
  (supplied as a bare hash — obtain their vkey + a proof-of-control signature
  before the immutable mint).
- **Board (3)** — Benkort (CF) / Gianelloni (Blink) / Kilgore (IOG), unchanged.

### Permission topology (baked into script params at mint)

| Action | Multisig |
|---|---|
| `treasury.reorganize` | K_op alone |
| `treasury.sweep` | 1-of-3 board |
| `treasury.disburse` | AllOf[ Lantr, FluidTokens, 1-of-3 board ] |
| `treasury.fund` | 2-of-3 board (+ vendor consent, enforced by `fund.ak`) |
| `vendor.pause` | 1-of-3 board |
| `vendor.resume` | 2-of-3 board |
| `vendor.modify` | 2-of-3 board (+ vendor consent) |
| vendor claim (`withdraw`) | AllOf[ Lantr, FluidTokens ] (2-of-2, set at fund time) |

### Funding model (hybrid — deferred, but drives the config)

Only **Core development (₳3,937,500)** is locked in the vendor contract as
**four equal payouts of ₳984,375**: M0 (upfront mobilization advance, matures
at funding) + M1/M2/M3 at the quarter-ends. Everything else (audits, PM,
ecosystem, legal ≈ ₳7.27M) is `Disburse`d on invoice; the 10% contingency
stays at the treasury contract in ADA and is swept back to the Cardano Treasury
if unused. The milestone schedule and vendor claim multisig live in the
VendorDatum (set at fund time), NOT in script parameters.

**USDC/OTC (deferred).** The team intends to convert the committed spend to
USDC and fund the vendor contract in USDC. Two verified contract constraints
shape that later design: (1) the swap cannot be a single atomic treasury tx
(`disburse`'s `equal_plus_min_ada` forbids USDC re-entering a treasury output
in the same tx) — do Disburse ADA → ops wallet → OTC → pay USDC back into the
treasury address; (2) the contingency must stay in ADA — `sweep` refunds via
the Conway ADA-only `treasury_donation` and forces native assets to be retained
at the script, so USDC cannot be donated back to the Cardano Treasury.

## Cross-repo context

- Source contracts: `/Users/nau/projects/lantr/treasury-contracts/` (Aiken,
  audited by TxPipe and MLabs).
- The bridge itself: `/Users/nau/projects/lantr/ft-bifrost-bridge/` — the
  project this treasury withdrawal funds.
- Scalus monorepo: `/Users/nau/projects/lantr/scalus/` — Scala/scalus API
  patterns for the `treasury-publish/` pipeline.

## Dev environment

- `flake.nix` provides the toolchain: `bun`, `nodejs`, `jq`, `nixpkgs-fmt`,
  `scala-cli`, and `cardano-cli` (from the IOG `cardano-node` flake, cached at
  `cache.iog.io`).
- Enter with `nix develop` (or via direnv). Pinned to `nixpkgs/nixos-25.11`.
- First shell entry pulls the cardano-cli closure from `cache.iog.io`;
  subsequent entries are instant.

## Conventions

- **Never hand-edit** `deployment/*.json` or `keys/*` — both are machine-written
  by scripts and gitignored.
- Scripts default to `--dry-run` (build tx, print summary, do not submit).
  Submission requires the explicit `--submit` flag.
- Preview/preprod concrete config: `params/preview.ts` / `params/preprod.ts`
  (bun) and `Config.preview` / `Config.preprod` (scala). Both express the same
  Bifrost params + permission topology; keep them in parity.
- Mainnet config: `params/mainnet.ts` (bun) + `Config.mainnet` (scala) are
  filled in but **deferred** — submission waits on a clean preview rehearsal.
  `params/select.ts` does NOT auto-dispatch to mainnet; scripts import it
  explicitly so every mainnet path is visible at the call site.
- Any change to the config that alters a script hash (amount, T_max, any pkh,
  permission topology) must be mirrored in **both** pipelines and re-verified:
  regenerate the parity fixture (`bun scripts/parity-oracle.ts >
  treasury-publish/fixtures/parity-preprod.json`) and run
  `scala-cli test treasury-publish` + `bun run test`.
- The anchor signer has its own offline parity gate: bun `sign-anchor` and scala
  `signAnchor` must emit a byte-identical CIP-100 witness. If the anchor signing
  recipe or the stress fixture (`treasury-publish/fixtures/anchor-sign-fixture.json`)
  changes, regenerate the golden fixture (`bun run sign-parity-oracle` →
  `treasury-publish/fixtures/sign-parity.json`) and re-run `scala-cli test
  treasury-publish`. URDNA2015 on the JVM is `titanium-json-ld` + `titanium-rdfc`
  (needs Java 21; pinned in `treasury-publish/project.scala`); its canonical
  N-Quads are byte-identical to the bun `jsonld` library.
- Pinned versions in `package.json`; bumps are deliberate and justified in
  the commit message.
- Commit style: conventional (`feat:`, `fix:`, `docs:`, `chore:`, `test:`).
- **Record placement:** `journal/` is **only** for **mainnet** financial /
  administrative logs — mainnet on-chain submissions, deposits/refunds, treasury
  movements, key ceremonies (the real money-and-authority trail). Everything
  else — designs, specs, preview/preprod rehearsals + test runs, research,
  how-tos — goes under `docs/` (specs in `docs/superpowers/specs/`).
- **Proposal source flow is one-way:** HackMD
  (https://hackmd.io/@lantr/bifrost-bridge-2026) is the canonical full-text
  source. `docs/proposal.md` is the synced mirror (`curl
  https://hackmd.io/@lantr/bifrost-bridge-2026/download -o docs/proposal.md`).
  If the proposal has annexes, `bun run extract-pieces` splits `docs/proposal.md`
  into pinnable pieces; those derived files **must not be hand-edited**. Edit on
  HackMD → sync → re-extract → re-pin.

## Preview workflow order (near-term goal)

1. `bun run gen-keys` — produce the K_op operator payment + stake keys
   (already done; idempotent).
2. `curl …/bifrost-bridge-2026/download -o docs/proposal.md` — sync the
   proposal text; `bun run extract-pieces` if it has annexes.
3. `bun run pin <path> --role <role> --name <label>` for each pinnable piece.
   Each pin records its CID into `gov/pinned.json`.
4. `bun run build-anchor -- --network preview` — build `gov/anchor.preview.json`
   (CIP-108) from `docs/proposal.md`, embedding the IPFS CIDs in
   `body.references`.
5. `bun run sign-anchor` — add the ed25519 `authors[]` witness over the
   URDNA2015-canonicalized body. (Scala equivalent: `scala-cli run
   treasury-publish --main-class treasurypublish.signAnchor -- <anchor.json>` —
   byte-identical witness, enforced by `sign-anchor.parity.test.scala`.)
6. `bun run pin gov/anchor.preview.json --role anchor --name …` — the CID
   becomes `ANCHOR_URL` in the gov action.
7. `bun run init` (or `scala-cli run treasury-publish --main-class
   treasurypublish.init`) — mint the one-shot registry NFT, publish the
   registry datum.
8. `bun run register` — register treasury + vendor stake credentials
   (vote-delegated to AlwaysAbstain per the constitution) and the admin's
   personal stake key (so the gov-action deposit refund lands in a usable
   reward account).
9. `bun run gov` — emit the `treasuryWithdrawal` governance-action JSON.
10. `scripts/compare-parity-preview.sh <seed#ix> preview` — assert bun ⇄ scala
    parity on the live artifacts before submitting.
11. (Submit) the gov action via `cardano-cli`; deposit is read live from
    protocol params (preview ≈ 1,000 tADA — do NOT hardcode 100,000).

Post-ratification funding (`fund` → `vendor-withdraw`, `disburse`) is deferred.

## What NOT to do

- Do not add contract code (Aiken, Scala, or otherwise). If a change requires
  contract logic, raise it upstream with SundaeSwap.
- Do not add business-logic tests for SundaeSwap's package — we trust it.
- Do not commit secrets, `.env`, or anything under `keys/` / `deployment/`.
- Do not change config in one pipeline only — bun and scala must stay in parity.

## Gotchas (lessons that cost real time)

- **`@sundaeswap/treasury-funds@0.0.25` ships traced (debug) bytecode by
  default.** The codegen has a bug: each validator constructor reads
  `arguments[1]` into a local `var trace` but never assigns `this.trace`,
  so the ternary `this.trace ? <stripped> : <traced>` always picks
  TRACED. Result: vendor validator at ~17 KB exceeds the 16,384-byte
  `max_tx_size` and cannot be witnessed in any single tx — registration
  silently impossible. Workaround: `scripts/patch-sundae.ts` (postinstall)
  rewrites `this.trace` → `trace`, and we pass `trace: true` to
  `Utils.loadScripts(...)` and `OneshotOneshotMint(...)` to select the
  stripped (production) variant. Filed upstream:
  https://github.com/SundaeSwap-finance/treasury-contracts/issues/53.
- **`max_tx_size` is 16,384 bytes on BOTH preprod and mainnet** — the
  script-bloat ceiling is not preprod-specific. Verify via Blockfrost
  `/epochs/latest/parameters`.
- **Conway treasury withdrawals must reference the constitution's guardrails
  script.** Set `policyHash` in the `treasury_withdrawals_action` to the
  constitution's script hash (query via `cardano-cli conway query constitution`).
  The script must also be present as a witness with a Proposing redeemer
  (Unit/Void data), or the ledger rejects with `InvalidGuardrailsScriptHash` /
  `MissingScriptWitnessesUTXOW`.
- **Blaze's `addProposal()` does not auto-wire the Proposing redeemer or the
  guardrails script witness.** Manually: `tx.requiredPlutusScripts.add(scriptHash)`,
  push a `Redeemer` with `purpose: RedeemerPurpose.propose, index: 0n, data:
  Void().toCore()` into `tx.redeemers`, and `tx.provideScript(guardrailsScript)`.
  See `scripts/03-build-gov-action.ts`.
- **Blockfrost vs Blaze script CBOR wrap.** Blockfrost `/scripts/{hash}/cbor`
  serves scripts single-wrapped `bytes(flat_uplc)`; Blaze's
  `PlutusV3Script.fromCbor` expects double-wrap `bytes(bytes(flat_uplc))`. Add
  one more CBOR `bytes(...)` header before passing to `fromCbor` — see
  `fetchScriptCbor` in `03-build-gov-action.ts`.
- **`HotSingleWallet` produces an enterprise address unless you pass a stake
  skey.** `loadProvider` auto-loads `keys/admin.stake.skey` if present so the
  wallet's `address` is the base form (matches `keys/admin.addr`). Without it,
  `blaze.wallet.getUnspentOutputs()` queries the wrong address and finds zero
  UTxOs even when you funded the base address.
- **Multi-key signing for the two-vendor + board multisig is not wired yet.**
  `init` and `register` only need K_op's signature. `fund` / `disburse` /
  `sweep` / `vendor.modify` / vendor `withdraw` will need loading the relevant
  signers (both vendors, and/or board members) and accumulating witnesses. Not
  blocking gov-action submission; relevant only post-ratification.
- **Preview gov-action params differ from preprod and CHANGED in June 2026.**
  `gov_action_deposit` on preview dropped **100,000 → 1,000 tADA** at
  epoch 1329/1330 (~2026-06-14/15) — verified via Blockfrost and Koios. Preview
  `gov_action_lifetime` is **30 epochs**, not preprod's 6. Mainnet is still
  100,000 ADA. Always read the deposit live from protocol params; the
  `ProposalProcedure.deposit` must equal it exactly or the tx is rejected.
  Testnet params reset/drift, so re-verify each cycle.
- **Conway preprod gov-action params:** `gov_action_deposit` is 100,000 tADA
  and `gov_action_lifetime` is 6 epochs (~6 days, NOT 30). Standard preprod
  faucet caps at 10k/24h per IP.
- **CIP-100 anchor hash is blake2b-256, not SHA-256.** Use
  `sodium.crypto_generichash(32, anchorBytes)`. Verify with `b2sum -l 256`.
- **Anchor URL scheme: `ipfs://` works on mainnet indexers** (19/20 of the last
  20 mainnet gov actions surveyed 2026-05 use it, most displaying valid
  metadata). We still emit `https://gateway.pinata.cloud/ipfs/<cid>` in
  `03-build-gov-action.ts` as belt-and-braces. Preprod cexplorer may behave
  differently — not re-verified.
- **Missing top-level `authors` IS the dbsync hard reject for "Invalid
  metadata".** Emit `authors[]` with a real ed25519 witness — see
  https://github.com/IntersectMBO/cardano-db-sync/issues/2088.
- **"Invalid metadata" on cexplorer is ~10-15% noise from its own offchain
  fetcher.** After submitting, verify via Koios `/proposal_list` (`meta_json`);
  if Koios shows the parsed body, the ledger and most tooling see it correctly
  even if cexplorer's UI lags.
- **CIP-100 / CIP-108 spec compliance is enforced by dbsync.** `authors` is
  required at the top level. Our pipeline emits a canonical anchor: nested
  `@context`, populated `authors[]` with an ed25519 witness over the
  URDNA2015-canonicalized body, no extra body fields. Schema validation runs at
  the end of both `build-anchor` and `sign-anchor` via
  `scripts/lib/validate-anchor.ts` against the vendored
  `schemas/cip-0108.common.schema.json`.
- **CIP-100 body signing is URDNA2015 → blake2b-256 → ed25519.** Filter the
  JSON-LD document to `{@context, body}`, canonicalize via `jsonld.canonize`
  (`algorithm: "URDNA2015", format: "application/n-quads"`), ensure the trailing
  newline, blake2b-256 the UTF-8 bytes, ed25519-sign that 32-byte hash. The
  signature lives in `authors[*].witness.signature` (hex). See
  `scripts/sign-anchor.ts`.
- **Bare `$` in `docs/proposal.md` triggers MathJax rendering** on GitHub,
  HackMD, and gov.tools. Escape as `\$`. The HackMD-sync pipeline drops
  escapes — the local fix is one-way until HackMD is also corrected. (The
  Bifrost proposal uses `$…$` LaTeX heavily for the bridge's economic model —
  watch this when syncing.)
- **CIP-108 caps `body.title` at 80 characters** (spec text + upstream JSON
  schema `maxLength`). `build-anchor.ts` fails fast on an oversized H1 title,
  `assertAnchorValid` enforces the full schema, and scala's
  `BuildGovAction.assertTitleLength` guards the submission step.
