# Scalus Treasury Withdrawal Setup — Design

**Date:** 2026-04-19
**Status:** Approved (brainstorming phase)
**Target environment:** Preprod first; mainnet config scaffolded as placeholder.

## Goal

Set up the Cardano treasury-withdrawal infrastructure for the upcoming
"Scalus Application Platform and Node Diversity" governance proposal.

This repo **parameterizes and operates** the audited SundaeSwap
`treasury-funds` contracts. It does **not** port them to Scalus.

## Non-goals

- Reimplementing any validator logic in Scala/Scalus
- Authoring the proposal justification document (kept in a separate repo / on
  `scalus.org`)
- Production hardening of mainnet config (scaffold only — concrete values to be
  filled when the real proposal is drafted)

## Architecture

```
           ┌──────────────────────────────────────────────┐
           │ @sundaeswap/treasury-funds (npm, audited)    │
           │   • compiled plutus scripts                  │
           │   • blaze-based tx builders                  │
           └──────────────────────────────────────────────┘
                                ▲
                                │ consumed as pinned dep
                                │
   ┌────────────────────────────┴───────────────────────────┐
   │ scalus-treasury (this repo)                            │
   │                                                         │
   │   params/*.ts   ──▶  concrete config values             │
   │   scripts/*.ts  ──▶  thin operational wrappers          │
   │   gov/*.json    ──▶  governance-action artifacts        │
   │   deployment/   ──▶  generated state (script hashes,    │
   │                      policy ids, tx hashes)             │
   └────────────────────────────────────────────────────────┘
```

The SundaeSwap package does the heavy lifting (script compilation,
multisig evaluation, transaction construction). This repo supplies
parameters, orchestrates the deployment sequence, and emits the
governance-action JSON for `cardano-cli` to submit.

## Repository layout

```
scalus-treasury/
├── CLAUDE.md                 # AI-coding guidance for this repo
├── README.md                 # preprod quickstart + links
├── package.json              # pins @sundaeswap/treasury-funds + blaze
├── tsconfig.json
├── bunfig.toml
├── .gitignore                # keys/, deployment/, .env, build/
├── docs/
│   └── superpowers/specs/    # this file
├── params/
│   ├── common.ts             # shared types + helpers
│   ├── preprod.ts            # concrete values (runnable)
│   └── mainnet.ts            # placeholders (not runnable)
├── scripts/
│   ├── gen-keys.ts
│   ├── 01-init-registry.ts
│   ├── 02-register-scripts.ts
│   ├── 03-build-gov-action.ts
│   ├── 04-withdraw.ts
│   ├── 05-fund-vendor.ts
│   ├── 06-vendor-withdraw.ts
│   └── lib/                  # provider setup, config loader
├── gov/
│   └── anchor.json           # CIP-108 stub
├── keys/                     # gitignored, script-generated
└── deployment/               # gitignored, script-generated state
    └── preprod.json
```

## Parameters — preprod (concrete)

| Field                      | Value                                                          |
|----------------------------|----------------------------------------------------------------|
| proposer / admin address   | `addr_test1qzwg0u9fpl8dac9rkramkcgzerjsfdlqgkw0q8hy5vwk8tzk5pgcmdpe5jeh92guy4mke4zdmagv228nucldzxv95clq68fray` |
| admin pkh                  | derived from address payment credential                        |
| admin multisig             | `Signature(admin_pkh)` — used for **all 7** permissions + vendor |
| withdrawal amount          | 1,000,000 tADA = `1_000_000_000_000` lovelace                  |
| number of milestones       | 1                                                              |
| milestone maturation       | deploy time + 30 days                                          |
| milestone value            | full 1M tADA                                                   |
| treasury expiration        | milestone maturation + 180 days                                |
| vendor payout upperbound   | = treasury expiration                                          |
| registry policy            | minted at deploy time (one-shot)                               |
| anchor URL                 | `https://scalus.org`                                           |
| anchor hash                | sha256 of `gov/anchor.json`                                    |
| provider                   | Blockfrost preprod (project ID via `.env`)                     |

Single admin + single milestone: smallest surface area to exercise the full
lifecycle (init → register → gov action → withdraw → fund → claim) on preprod
solo. Mainnet will replace with a real oversight committee and schedule.

## Parameters — mainnet (placeholder)

`params/mainnet.ts` mirrors preprod's shape but every field is a `TODO`
comment. The file is intentionally not runnable — it exists so the structure
is obvious when the real proposal is drafted.

## Operational flow (preprod)

1. **`gen-keys.ts`** — generate `./keys/admin.{skey,vkey,addr}` if missing.
2. **`01-init-registry.ts`** — mint one-shot NFT at `oneshot` policy, publish
   `ScriptHashRegistry` datum under the always-fails script. Records
   `policyId`, registry address, treasury + vendor script hashes/addresses to
   `deployment/preprod.json`.
3. **`02-register-scripts.ts`** — register both treasury and vendor stake
   credentials and delegate voting power to `AlwaysAbstain` DRep (constitution
   Article IV §5).
4. **`03-build-gov-action.ts`** — emit `gov/preprod-withdrawal.json` containing
   the `treasuryWithdrawal` payload (recipient = treasury script stake addr,
   amount = 1M tADA, anchor). README documents the `cardano-cli conway
   governance action create-treasury-withdrawal` invocation. Submission is
   manual because it needs the proposer's funded wallet.
5. **`04-withdraw.ts`** — after vote passes, pulls ADA from the treasury
   script's reward account into its spending address via the `withdraw`
   purpose of `treasury.ak`.
6. **`05-fund-vendor.ts`** — treasury → vendor, locking the milestone datum.
7. **`06-vendor-withdraw.ts`** — after maturation, vendor claims the payout.

Scripts are idempotent where possible: re-running `01-init-registry.ts` with
`deployment/preprod.json` already populated is a no-op with a clear message.

## Governance action details

The `treasuryWithdrawal` action contains:

- **Recipient**: the treasury script's stake address (derived from its script
  hash — this is what makes the contract the custodian of the withdrawn ADA).
- **Amount**: 1,000,000 ADA.
- **Anchor**: `{ url: "https://scalus.org", hash: sha256(gov/anchor.json) }`.
  On preprod the URL and hash need not agree with served content — this is a
  stub. On mainnet the URL must resolve to a document whose sha256 matches the
  anchor hash (CIP-100/CIP-108).
- **Return address**: the proposer address above (receives the action deposit
  refund on enactment / rejection).

We do **not** submit the action from this repo — `cardano-cli` does that.
We produce the JSON payload and the invocation command; the human runs it.

## Dependencies

| Package                                | Purpose                             |
|----------------------------------------|-------------------------------------|
| `@sundaeswap/treasury-funds`           | audited contracts + tx builders     |
| `@blaze-cardano/sdk`                   | transaction construction            |
| `@blaze-cardano/blockfrost`            | preprod provider                    |
| `@blaze-cardano/core` (transitively)   | keys, addresses, hashing            |
| `typescript`, `@types/bun` (dev)       | types + runtime                     |

Versions pinned exactly in `package.json`; bumps are deliberate.

## Key handling

- Preprod admin key generated locally by `gen-keys.ts`; stored as cleartext in
  `./keys/` (gitignored). Acceptable because preprod ADA has no value.
- **Mainnet**: never commit keys. Config file references key material by
  abstract identifier; resolution is out of scope for this repo (likely
  hardware wallets signing `cardano-cli` transactions in a separate flow).

## Provider configuration

- `.env` (gitignored) holds `BLOCKFROST_PROJECT_ID` and `NETWORK=preprod`.
- `scripts/lib/provider.ts` reads env and constructs a single `Blaze` instance
  reused by all scripts.

## Git + docs

- `git init` with initial commit of the scaffold.
- `.gitignore`: `keys/`, `deployment/`, `node_modules/`, `.env`, `build/`,
  `dist/`, `*.log`.
- `CLAUDE.md`: explains "parameterize, don't port", lists preprod workflow
  order, warns against hand-editing `deployment/*.json`, points at
  `/Users/nau/projects/lantr/scalus/Claude.md` for broader Scalus context and
  at `/Users/nau/projects/lantr/treasury-contracts/` for the source contracts.
- `README.md`: what this repo is, preprod quickstart
  (`bun install && bun scripts/gen-keys.ts && …`), links to SundaeSwap
  contracts and their audits.

## Open questions / deferred decisions

1. **`@sundaeswap/treasury-funds` API shape** — the package README says an
   npm-published SDK exists; the exact exported entry points (script builders,
   parameter types) must be verified when we implement. The plan step that
   installs the package will also catalogue its API before writing operational
   scripts.
2. **Preprod DRep voting** — to actually pass the governance action on preprod
   we need existing preprod DReps to vote for it (or use SanchoNet-style test
   setup). Out of scope for this design; will be handled operationally.
3. **Anchor JSON content** — `gov/anchor.json` is a minimal CIP-108 stub for
   preprod. Real content comes from the separate proposal-docs effort.

## Success criteria

- `bun install` succeeds with pinned versions.
- `bun scripts/gen-keys.ts` produces usable keys.
- `bun scripts/01-init-registry.ts` mints the registry NFT on preprod and
  writes `deployment/preprod.json` with all derived addresses.
- `bun scripts/03-build-gov-action.ts` emits a `treasuryWithdrawal` JSON whose
  `cardano-cli conway governance action create-treasury-withdrawal` accepts it.
- Full flow (steps 1–6) executes end-to-end on preprod with the single admin
  key, ending with the admin successfully claiming the matured milestone.
- Mainnet config file is present, clearly placeholder, and would type-check
  once filled.
