# CLAUDE.md

## What this repo is

Operational setup for the Cardano treasury withdrawal funding the Scalus
Application Platform and Node Diversity initiative. Parameterizes and drives
the audited SundaeSwap `treasury-funds` contracts via their published TS
package. **Does not port or reimplement contracts.**

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
- Mainnet placeholder: `params/mainnet.ts` (NOT runnable until TODOs filled).
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
7. `bun run register` — register + delegate both scripts to AlwaysAbstain DRep.
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
