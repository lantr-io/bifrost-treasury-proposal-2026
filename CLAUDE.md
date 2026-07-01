# CLAUDE.md

## What this repo is

Operational setup for the Cardano treasury withdrawal funding the Scalus
Application Platform and Node Diversity initiative. Parameterizes and drives
the audited SundaeSwap `treasury-funds` contracts via their published TS
package. **Does not port or reimplement contracts.**

## Active proposal (as of 2026-06-29)

The live effort is the **reduced resubmission** "Scalus 2026: Maintenance,
Dijkstra Readiness, Interoperability & Application Runtime" (HackMD
`@lantr/scalus2026-2`): **₳2,464,844** ($0.16/ADA), 9 months, no contingency,
T_max **2027-07-01** (vendor +30d). It supersedes the expired ₳8,503,000 /
12-month proposal. Design + plan: `docs/superpowers/specs/2026-06-25-*.md` and
`docs/superpowers/plans/2026-06-25-*.md` (those docs predate the budget cut to
₳2,464,844 and are point-in-time).

- **Fresh deployment** (reuses existing admin + board keys; new T_max forces
  new treasury/vendor script hashes). Rehearsed on **preview** (gov action
  `e3c1f115…`) then **SUBMITTED ON MAINNET 2026-06-29** via the Scalus pipeline:
  gov action `gov_action1xg69v73…` (tx `3234567a…`), ₳2,464,844, deposit
  100,000 ADA, anchor `QmcZPnd…` parsed on Koios. init `e2ab7afa`, register
  `45f80f36`, treasury `857e556d…`, vendor `e5ae4591…`. See
  `journal/2026-06-29-mainnet-scalus2026-2-submit.md`. DRep vote runs to epoch 647.
- **Funding:** the expired prior ₳8,503,000 mainnet proposal (`e0900fdd…`,
  expired epoch 637) refunded its 100k deposit; recovered via
  `recover-deposits` to fund this submission's deposit.
- **IPFS references are the real scalus2026-2 PDFs** (proposal `QmcxVb3ZKX…`,
  annex1 `QmXmA7iGez…`, annex2 `QmZxgZMk9t…`, annex3 `QmdxcAZoSy…`). The
  proposal.md Supporting-links repoint is local-only; HackMD still shows
  `IPFS, PDF` placeholders — converge it for the record.

## Cross-repo context

- Source contracts: `/Users/nau/projects/lantr/treasury-contracts/` (Aiken,
  audited by TxPipe and MLabs).
- Scalus monorepo: `/Users/nau/projects/lantr/scalus/` — consult for Scalus
  API patterns if a Scalus-side counterpart is ever added.

## Dev environment

- `flake.nix` provides the toolchain: `bun`, `nodejs`, `jq`, `nixpkgs-fmt`,
  and `cardano-cli` (from the IOG `cardano-node` flake, cached at
  `cache.iog.io`).
- Enter with `nix develop` (or via direnv). Pinned to `nixpkgs/nixos-25.11`.
- The first shell entry pulls the cardano-cli closure from `cache.iog.io`;
  subsequent entries are instant.

## Conventions

- **Never hand-edit** `deployment/*.json` or `keys/*` — both are machine-written
  by scripts and gitignored.
- Scripts default to `--dry-run` (build tx, print summary, do not submit).
  Submission requires the explicit `--submit` flag.
- Preprod concrete config: `params/preprod.ts` (runnable).
- Mainnet config: `params/mainnet.ts` (bun) + `Config.mainnet` (scalus) are
  filled in and runnable — ₳2,464,844, T_max 2027-07-01, admin `addr1qyhvk2…`.
  `params/select.ts` still does NOT auto-dispatch to mainnet; scripts import it
  explicitly so every mainnet path is visible at the call site.
- Pinned versions in `package.json`; bumps are deliberate and justified in
  the commit message.
- Commit style: conventional (`feat:`, `fix:`, `docs:`, `chore:`, `test:`).
- **Proposal source flow is one-way:** HackMD
  (https://hackmd.io/@lantr/scalus2026) is the canonical full-text source.
  `docs/proposal.md` is the synced mirror (`curl
  https://hackmd.io/@lantr/scalus2026/download -o docs/proposal.md`).
  `docs/proposal-main.md` and `docs/annex-{1,2,3}.md` are derived from
  `docs/proposal.md` by `bun run extract-pieces` and **must not be
  hand-edited** — the next extraction overwrites them. Edit on HackMD →
  sync → re-extract → re-pin.

## Preprod workflow order

1. `bun run gen-keys` — produce admin payment + stake keys.
2. `bun run extract-pieces` — split `docs/proposal.md` into
   `docs/proposal-main.md` + `docs/annex-{1,2,3}.md`.
3. `bun run pin <path> --role <role> --name <label>` for each of:
   `proposal-main`, `annex1`, `annex2`, `annex3`. Each pin records its
   CID into `gov/pinned.json` (committed).
4. `bun run build-anchor -- --network preprod` — regenerate
   `gov/anchor.preprod.json` from `docs/proposal.md`, embedding the four
   IPFS CIDs in `body.references`.
5. `bun run pin gov/anchor.preprod.json --role anchor --name …` — the
   resulting CID becomes `ANCHOR_URL` in the gov action.
6. `bun run init` — mint one-shot registry NFT, publish registry datum.
7. `bun run register` — register all three stake credentials in one tx:
   treasury + vendor (vote-delegated to AlwaysAbstain per constitution)
   and the admin's personal stake key (registered without delegation,
   so the gov-action deposit refund can land in a usable reward account).
8. `bun run gov` — emit the `treasuryWithdrawal` governance-action JSON.
9. (Manual) submit the gov action via `cardano-cli`, wait for it to pass.
10. `bun run withdraw` — pull ADA from the treasury reward account.
11. `bun run fund` — treasury → vendor contract (requires milestone
    schedule wired in; currently a `TODO(milestone-schedule)` stub).
12. (Wait for milestone maturation.)
13. `bun run vendor-withdraw` — admin claims the matured payout.

## What NOT to do

- Do not add contract code (Aiken, Scalus, or otherwise). If a change requires
  contract logic, raise it upstream with SundaeSwap.
- Do not add business-logic tests for SundaeSwap's package — we trust it.
- Do not commit secrets, `.env`, or anything under `keys/` / `deployment/`.

## Gotchas (lessons that cost real time)

- **`@sundaeswap/treasury-funds@0.0.25` ships traced (debug) bytecode by
  default.** The codegen has a bug: each validator constructor reads
  `arguments[1]` into a local `var trace` but never assigns `this.trace`,
  so the ternary `this.trace ? <stripped> : <traced>` always picks
  TRACED. Result: vendor validator at ~17 KB exceeds the 16,384-byte
  `max_tx_size` and cannot be witnessed in any single tx — registration
  silently impossible. Workaround: `scripts/patch-sundae.ts`
  (postinstall) rewrites `this.trace` → `trace`, and we pass `trace:
  true` to `Utils.loadScripts(...)` and `OneshotOneshotMint(...)` to
  select the stripped (production) variant. Filed upstream:
  https://github.com/SundaeSwap-finance/treasury-contracts/issues/53.
- **`max_tx_size` is 16,384 bytes on BOTH preprod and mainnet** — the
  script-bloat ceiling is not preprod-specific. Verify with `gh
  query` / Blockfrost `/epochs/latest/parameters`.
- **Conway treasury withdrawals must reference the constitution's
  guardrails script.** Set `policyHash` in the
  `treasury_withdrawals_action` to the constitution's script hash (on
  preprod: `fa24fb305126805cf2164c161d852a0e7330cf988f1fe558cf7d4a64`;
  query via `cardano-cli conway query constitution --testnet-magic 1`).
  The script must also be present as a witness with a Proposing
  redeemer (Unit/Void data), or the ledger rejects with
  `InvalidGuardrailsScriptHash` / `MissingScriptWitnessesUTXOW`.
- **Blaze's `addProposal()` does not auto-wire the Proposing redeemer
  or the guardrails script witness.** Manually:
  `tx.requiredPlutusScripts.add(scriptHash)`, push a `Redeemer` with
  `purpose: RedeemerPurpose.propose, index: 0n, data: Void().toCore()`
  into `tx.redeemers`, and `tx.provideScript(guardrailsScript)`. Same
  internal mechanics Blaze uses for `addRegisterStake` with a script
  credential, just not exposed via API. See
  `scripts/03-build-gov-action.ts`.
- **Blockfrost vs Blaze script CBOR wrap.** Blockfrost
  `/scripts/{hash}/cbor` serves scripts as single-wrap
  `bytes(flat_uplc)`. Blaze's `PlutusV3Script.fromCbor` expects
  double-wrap `bytes(bytes(flat_uplc))` because that's the on-chain
  witness encoding it hashes from. Add one more CBOR `bytes(...)`
  header to a Blockfrost script before passing to `fromCbor` — see
  `fetchScriptCbor` in `03-build-gov-action.ts`.
- **`HotSingleWallet` produces an enterprise address unless you pass a
  stake skey.** `loadProvider` auto-loads `keys/admin.stake.skey` if
  present so the wallet's `address` is the base form (matches
  `keys/admin.addr`). Without it, `blaze.wallet.getUnspentOutputs()`
  queries the wrong address and finds zero UTxOs even when you
  funded the base address.
- **Multi-key signing for the operator+board multisig is not wired
  yet.** `01-init` and `02-register` only need K_op's signature.
  `treasury.fund` / `disburse` / `sweep` / `vendor.modify` will need
  loading `keys/board-{1,2,3}.skey`, signing each, and accumulating
  witnesses. Not blocking gov-action submission; relevant only
  post-ratification.
- **Conway preprod gov-action params:** `gov_action_deposit` is
  100,000 tADA (same as mainnet) and `gov_action_lifetime` is 6
  epochs (~6 days, NOT 30). Standard preprod faucet caps at 10k/24h
  per IP, so sourcing the deposit takes either ~10 days of pulls or
  elevated quota from Intersect.
- **Preview gov-action params differ from preprod and CHANGED in
  June 2026.** `gov_action_deposit` on preview dropped **100,000 →
  1,000 tADA** at epoch 1329/1330 (~2026-06-14/15) — verified via both
  Blockfrost `/epochs/latest/parameters` and Koios `/epoch_params`,
  and corroborated by our own `c7f69982` action (2026-06-25) which
  recorded a 1,000-tADA deposit. Preview `gov_action_lifetime` is **30
  epochs**, not preprod's 6. So on preview the live-fetched 1,000 tADA
  is correct — do NOT hardcode 100,000. Mainnet is still 100,000 ADA
  (confirmed by the 2025 Scalus withdrawal `8ad3d454…#17`). Always read
  the deposit live from protocol params; the `ProposalProcedure.deposit`
  must equal it exactly or the tx is rejected. Testnet params reset/drift,
  so re-verify each cycle.
- **CIP-100 anchor hash is blake2b-256, not SHA-256.** Use
  `sodium.crypto_generichash(32, anchorBytes)`. Verify independently
  with `b2sum -l 256`.
- **Anchor URL scheme: `ipfs://` works on mainnet indexers.** Surveyed
  the last 20 mainnet gov actions on cexplorer.io (2026-05): 19/20 use
  `ipfs://` anchor URLs and 17 of those display valid metadata. The
  earlier hypothesis that `ipfs://` itself causes "Invalid metadata"
  on cexplorer was based on preprod observation only — mainnet's
  offchain fetcher resolves IPFS fine. We still emit
  `https://gateway.pinata.cloud/ipfs/<cid>` in `03-build-gov-action.ts`
  as belt-and-braces (HTTPS can only help; the bytes at the CID are
  content-addressed either way), but on mainnet `ipfs://` is not the
  bug. Preprod cexplorer may behave differently — not re-verified.
- **Missing top-level `authors` IS the dbsync hard reject for "Invalid
  metadata".** Out of 3 invalid-metadata actions in the mainnet survey,
  1 (HLABS Pebble + Gerolamo 2026 Budget) is missing `authors` entirely
  and matches the rejection pattern in
  https://github.com/IntersectMBO/cardano-db-sync/issues/2088. The
  other 2 invalid actions had full `authors` + ed25519 witnesses and
  were just cexplorer's offchain fetcher failing (see next gotcha).
  Emit `authors[]` with a real ed25519 witness — necessary, even
  though many real-world anchors get away without it.
- **"Invalid metadata" on cexplorer is ~10-15% noise from its own
  offchain fetcher.** In the same mainnet survey, 2 of 3 invalid
  actions had structurally identical anchors to valid siblings — full
  authors+witness, hash matches, canonical structure — yet cexplorer
  showed "Invalid metadata". Koios's `/proposal_list` returned
  populated `meta_json` for all three. So: after submitting, don't
  treat cexplorer's badge as authoritative. Verify via Koios; if Koios
  shows the parsed body, the ledger and most tooling see it correctly
  even if cexplorer's UI lags.
- **CIP-100 / CIP-108 spec compliance is enforced by dbsync.** The
  JSON Schema at
  `https://raw.githubusercontent.com/cardano-foundation/CIPs/master/CIP-0108/cip-0108.common.schema.json`
  marks `authors` as required at the top level, and dbsync enforces
  this — see the gotcha above. Our pipeline emits a fully canonical
  anchor: nested `@context` matching the CIP-108 reference example,
  populated `authors[]` with an ed25519 witness over the
  URDNA2015-canonicalized body, no extra body fields. Schema validation
  runs at the end of both `build-anchor` and `sign-anchor` via
  `scripts/lib/validate-anchor.ts` (using `schemas/cip-0108.common.schema.json`
  vendored at a pinned version). Note: 9 of 17 valid mainnet anchors
  actually use a non-canonical flat `@context` shape, so the strict
  nested form isn't *required* in practice — but our pipeline emits
  it anyway as a strict superset.
- **CIP-100 body signing is URDNA2015 → blake2b-256 → ed25519.** Filter
  the JSON-LD document to `{@context, body}`, canonicalize via
  `jsonld.canonize` with `algorithm: "URDNA2015", format: "application/n-quads"`,
  ensure the trailing newline is present, blake2b-256 the UTF-8 bytes,
  ed25519-sign that 32-byte hash. The signature lives in
  `authors[*].witness.signature` (hex). See `scripts/sign-anchor.ts`.
  Filtering at the JSON-LD level (rather than canonicalizing the full
  doc and then trying to extract the body subgraph from N-Quads) is the
  trick used by `gitmachtl/cardano-signer` — saves a lot of complexity.
- **Bare `$` in `docs/proposal.md` triggers MathJax rendering** on
  GitHub, HackMD, and gov.tools. Escape as `\$`. The HackMD-sync
  pipeline drops escapes — the local fix is one-way until HackMD is
  also corrected.
- **CIP-108 caps `body.title` at 80 characters** (spec text + upstream
  JSON schema `maxLength`, confirmed 2026-07-01 — not folklore). Our
  vendored `schemas/cip-0108.common.schema.json` (pinned since commit
  `3f3d685`) had drifted from upstream and was missing this (plus
  `abstract.maxLength: 2500`, required `witness` fields, and
  `references.uniqueItems`) — re-synced verbatim. `build-anchor.ts` now
  fails fast on an oversized H1 title, `assertAnchorValid` enforces the
  full schema, and scalus's `BuildGovAction.assertTitleLength` guards
  the submission step. **Informational only:** the already-submitted
  mainnet and preview anchors both carry an 84-char title (over the
  cap) predating this fix — their anchor hash is already on-chain, so
  this cannot be corrected retroactively without invalidating the
  governance action.
