# Treasury Withdrawal Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a Bun/TypeScript repo that parameterizes the audited `@sundaeswap/treasury-funds` contracts for the "Scalus Application Platform and Node Diversity" Cardano treasury withdrawal, operable end-to-end on preprod with a single admin key.

**Architecture:** Pin `@sundaeswap/treasury-funds` as an npm dependency and write thin operational scripts around it. Preprod concrete config lives in `params/preprod.ts`; mainnet is a placeholder-only file. Blockfrost provides chain access. Scripts run via Bun. Derived state (script hashes, registry policy, tx hashes) is machine-written to `deployment/preprod.json`; never hand-edited.

**Tech Stack:** Bun, TypeScript, `@sundaeswap/treasury-funds`, `@blaze-cardano/sdk`, `@blaze-cardano/blockfrost`, `@blaze-cardano/core`.

**Reference material:**
- Design spec: `docs/superpowers/specs/2026-04-19-treasury-withdrawal-setup-design.md`
- SundaeSwap source (sibling dir): `/Users/nau/projects/lantr/treasury-contracts/`
- SundaeSwap package: `@sundaeswap/treasury-funds` (v0.0.25 at time of writing)
- Key exports (confirmed by inspecting sibling source):
  - From root: `TreasuryConfiguration`, `VendorConfiguration`, `MultisigScript`, `TreasurySpendRedeemer`, `VendorDatum`, `VendorSpendRedeemer`, `ScriptHashRegistry`, `OneshotOneshotMint`, `TreasuryTreasuryWithdraw`, `VendorVendorSpend`
  - `Utils.loadScripts(network, treasuryConfig, vendorConfig, trace?)`
  - `Utils.loadTreasuryScript`, `Utils.loadVendorScript`
  - `Treasury.fund`, `Treasury.withdraw`, `Treasury.disburse`, `Treasury.reorganize`, `Treasury.sweep`
  - `Vendor.withdraw`, `Vendor.adjudicate`, `Vendor.complete`, `Vendor.malformed`, `Vendor.modify`, `Vendor.sweep`

**Testing strategy:**
- Pure helpers (param resolution, address derivation, script compilation) → TDD with `bun test`.
- Operational scripts → each gains a default `--dry-run` mode that builds the transaction and prints a summary without submitting. Submission requires `--submit` and a funded preprod wallet. Manual end-to-end check on preprod is the ultimate validation.

**Working directory:** `/Users/nau/projects/lantr/scalus-treasury` (already `git init`-ed; one commit present with the spec).

---

## Task 1: Repo scaffolding

**Files:**
- Create: `.gitignore`
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `bunfig.toml`
- Create: `.env.example`

- [ ] **Step 1: Write `.gitignore`**

Create `/Users/nau/projects/lantr/scalus-treasury/.gitignore`:

```
node_modules/
dist/
build/
.env
.env.*
!.env.example

# generated state - never commit
keys/
deployment/

# editor + OS noise
.DS_Store
.idea/
.vscode/
*.log
```

- [ ] **Step 2: Write `package.json`**

Create `/Users/nau/projects/lantr/scalus-treasury/package.json`:

```json
{
  "name": "scalus-treasury",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "description": "Parameterization and operations for the Cardano treasury withdrawal funding Scalus Application Platform and Node Diversity",
  "scripts": {
    "test": "bun test",
    "typecheck": "tsc --noEmit",
    "gen-keys": "bun scripts/gen-keys.ts",
    "init": "bun scripts/01-init-registry.ts",
    "register": "bun scripts/02-register-scripts.ts",
    "gov": "bun scripts/03-build-gov-action.ts",
    "withdraw": "bun scripts/04-withdraw.ts",
    "fund": "bun scripts/05-fund-vendor.ts",
    "vendor-withdraw": "bun scripts/06-vendor-withdraw.ts"
  },
  "dependencies": {
    "@sundaeswap/treasury-funds": "0.0.25",
    "@blaze-cardano/sdk": "0.2.33",
    "@blaze-cardano/core": "0.6.8",
    "@blaze-cardano/blockfrost": "0.1.31",
    "@blaze-cardano/data": "0.6.0",
    "@blaze-cardano/query": "0.5.0",
    "@blaze-cardano/uplc": "0.4.1"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "5.8.3"
  },
  "engines": {
    "bun": ">=1.1"
  }
}
```

- [ ] **Step 3: Write `tsconfig.json`**

Create `/Users/nau/projects/lantr/scalus-treasury/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "types": ["bun-types"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["params/**/*.ts", "scripts/**/*.ts", "*.ts"],
  "exclude": ["node_modules", "dist", "build"]
}
```

- [ ] **Step 4: Write `bunfig.toml`**

Create `/Users/nau/projects/lantr/scalus-treasury/bunfig.toml`:

```toml
[install]
exact = true
```

- [ ] **Step 5: Write `.env.example`**

Create `/Users/nau/projects/lantr/scalus-treasury/.env.example`:

```
# Network: preprod or mainnet. Controls which params/*.ts module is loaded.
NETWORK=preprod

# Blockfrost project id for the target network.
# Get one from https://blockfrost.io (free tier works for preprod).
BLOCKFROST_PROJECT_ID=preprod_REPLACE_ME
```

- [ ] **Step 6: Install dependencies**

Run: `bun install`
Expected: `bun.lock` created; no errors. If the registry returns a version mismatch, note the actual published version and update `package.json` accordingly (this is the one place we adjust versions on first install).

- [ ] **Step 7: Verify typecheck baseline works**

Run: `bun run typecheck`
Expected: passes with no files yet to check (tsconfig `include` globs resolve to nothing — that's fine; exit code 0).

- [ ] **Step 8: Commit**

```bash
git add .gitignore package.json tsconfig.json bunfig.toml .env.example bun.lock
git commit -m "chore: scaffold bun/typescript repo with pinned deps"
```

---

## Task 2: CLAUDE.md and README.md

**Files:**
- Create: `CLAUDE.md`
- Create: `README.md`

- [ ] **Step 1: Write `CLAUDE.md`**

Create `/Users/nau/projects/lantr/scalus-treasury/CLAUDE.md`:

```markdown
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
- Spec: `docs/superpowers/specs/2026-04-19-treasury-withdrawal-setup-design.md`.

## Conventions

- **Never hand-edit** `deployment/*.json` or `keys/*` — both are machine-written
  by scripts and gitignored.
- Scripts default to `--dry-run` (build tx, print summary, do not submit).
  Submission requires the explicit `--submit` flag.
- Preprod concrete config: `params/preprod.ts` (runnable).
- Mainnet placeholder: `params/mainnet.ts` (NOT runnable until TODOs filled).
- Pinned exact versions in `package.json`; bumps are deliberate and justified
  in the commit message.
- Commit style: conventional (`feat:`, `fix:`, `docs:`, `chore:`, `test:`).

## Preprod workflow order

1. `bun run gen-keys`
2. `bun run init` — mint one-shot registry NFT, publish registry datum.
3. `bun run register` — register + delegate both scripts to AlwaysAbstain DRep.
4. `bun run gov` — emit the `treasuryWithdrawal` governance-action JSON.
5. (Manual) submit the gov action via `cardano-cli`, wait for it to pass.
6. `bun run withdraw` — pull ADA from the treasury reward account.
7. `bun run fund` — treasury → vendor contract with the single milestone.
8. (Wait for milestone maturation.)
9. `bun run vendor-withdraw` — admin claims the matured payout.

## What NOT to do

- Do not add contract code (Aiken, Scalus, or otherwise). If a change requires
  contract logic, raise it upstream with SundaeSwap.
- Do not add business-logic tests for SundaeSwap's package — we trust it.
- Do not commit secrets, `.env`, or anything under `keys/` / `deployment/`.
```

- [ ] **Step 2: Write `README.md`**

Create `/Users/nau/projects/lantr/scalus-treasury/README.md`:

```markdown
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

## Upstream

- Contracts: [SundaeSwap-finance/treasury-funds](https://github.com/SundaeSwap-finance/treasury-funds)
- Audits (in that repo): TxPipe, MLabs
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md README.md
git commit -m "docs: add CLAUDE.md guidance and README quickstart"
```

---

## Task 3: Common param types and helpers

**Files:**
- Create: `params/common.ts`
- Test: `params/common.test.ts`

- [ ] **Step 1: Write the failing test**

Create `/Users/nau/projects/lantr/scalus-treasury/params/common.test.ts`:

```typescript
import { describe, expect, test } from "bun:test";
import { Core } from "@blaze-cardano/sdk";
import {
  addressPaymentKeyHash,
  resolveSchedule,
  type RawConfig,
} from "./common";

describe("addressPaymentKeyHash", () => {
  test("extracts payment key hash from a Shelley base address", () => {
    const addr =
      "addr_test1qzwg0u9fpl8dac9rkramkcgzerjsfdlqgkw0q8hy5vwk8tzk5pgcmdpe5jeh92guy4mke4zdmagv228nucldzxv95clq68fray";
    const pkh = addressPaymentKeyHash(addr);
    // Payment part of this address is a key hash, 28 bytes = 56 hex chars.
    expect(pkh).toMatch(/^[0-9a-f]{56}$/);
    // Round-trip: rebuilding the address from the key hash payment part
    // must reproduce the payment credential type.
    const parsed = Core.Address.fromBech32(addr);
    expect(parsed.getProps().paymentPart?.hash).toBe(pkh);
    expect(parsed.getProps().paymentPart?.type).toBe(Core.CredentialType.KeyHash);
  });

  test("rejects a reward address (no payment part)", () => {
    const rewardAddr =
      "stake_test1uq7gm2tvdg4v7z0c8lggtx7x0l4ftrfy7ck65fcg6gsvfdgkvfpfc";
    expect(() => addressPaymentKeyHash(rewardAddr)).toThrow();
  });

  test("rejects a script-payment address (not a key hash)", () => {
    // A script payment credential address must be rejected because
    // we only use this helper to derive an admin pkh.
    const scriptAddr =
      "addr_test1wrqvvu0m5jn06hz7lqq03q8hhrtj6qz4gfxxxx70krkgptsmtx22h";
    expect(() => addressPaymentKeyHash(scriptAddr)).toThrow();
  });
});

describe("resolveSchedule", () => {
  test("single-milestone schedule returns one entry with the full amount", () => {
    const raw: RawConfig = {
      network: "preprod",
      adminAddress:
        "addr_test1qzwg0u9fpl8dac9rkramkcgzerjsfdlqgkw0q8hy5vwk8tzk5pgcmdpe5jeh92guy4mke4zdmagv228nucldzxv95clq68fray",
      amountLovelace: 1_000_000_000_000n,
      milestoneCount: 1,
      milestoneSpacingDays: 30,
      firstMilestoneOffsetDays: 30,
      expirationGraceDays: 180,
    };
    const now = new Date("2026-05-01T00:00:00Z");
    const schedule = resolveSchedule(raw, now);
    expect(schedule).toHaveLength(1);
    expect(schedule[0]!.amountLovelace).toBe(1_000_000_000_000n);
    expect(schedule[0]!.maturation.toISOString()).toBe(
      "2026-05-31T00:00:00.000Z",
    );
  });

  test("multi-milestone schedule splits evenly and spaces correctly", () => {
    const raw: RawConfig = {
      network: "preprod",
      adminAddress:
        "addr_test1qzwg0u9fpl8dac9rkramkcgzerjsfdlqgkw0q8hy5vwk8tzk5pgcmdpe5jeh92guy4mke4zdmagv228nucldzxv95clq68fray",
      amountLovelace: 900_000_000_000n,
      milestoneCount: 3,
      milestoneSpacingDays: 90,
      firstMilestoneOffsetDays: 30,
      expirationGraceDays: 180,
    };
    const now = new Date("2026-05-01T00:00:00Z");
    const schedule = resolveSchedule(raw, now);
    expect(schedule).toHaveLength(3);
    // even split
    for (const entry of schedule) {
      expect(entry.amountLovelace).toBe(300_000_000_000n);
    }
    // maturation spacing
    expect(schedule[0]!.maturation.toISOString()).toBe(
      "2026-05-31T00:00:00.000Z",
    );
    expect(schedule[1]!.maturation.toISOString()).toBe(
      "2026-08-29T00:00:00.000Z",
    );
    expect(schedule[2]!.maturation.toISOString()).toBe(
      "2026-11-27T00:00:00.000Z",
    );
  });

  test("remainder lovelace goes to the last milestone (no coins lost)", () => {
    const raw: RawConfig = {
      network: "preprod",
      adminAddress:
        "addr_test1qzwg0u9fpl8dac9rkramkcgzerjsfdlqgkw0q8hy5vwk8tzk5pgcmdpe5jeh92guy4mke4zdmagv228nucldzxv95clq68fray",
      amountLovelace: 1_000_000_000_001n, // not evenly divisible
      milestoneCount: 3,
      milestoneSpacingDays: 30,
      firstMilestoneOffsetDays: 30,
      expirationGraceDays: 180,
    };
    const schedule = resolveSchedule(raw, new Date("2026-05-01T00:00:00Z"));
    const total = schedule.reduce((a, m) => a + m.amountLovelace, 0n);
    expect(total).toBe(1_000_000_000_001n);
    expect(schedule[schedule.length - 1]!.amountLovelace).toBe(
      333_333_333_333n + 1n,
    );
  });
});
```

- [ ] **Step 2: Run the failing test**

Run: `bun test params/common.test.ts`
Expected: FAIL — `Cannot find module './common'`.

- [ ] **Step 3: Write the implementation**

Create `/Users/nau/projects/lantr/scalus-treasury/params/common.ts`:

```typescript
import { Core } from "@blaze-cardano/sdk";

export type Network = "preprod" | "mainnet";

export interface RawConfig {
  network: Network;
  /** Bech32 Shelley base address whose payment key hash is the single admin. */
  adminAddress: string;
  /** Total amount to withdraw from the Cardano treasury, in lovelace. */
  amountLovelace: bigint;
  /** How many vendor milestones to split the amount into. >= 1, <= 24. */
  milestoneCount: number;
  /** Days of spacing between consecutive milestones. */
  milestoneSpacingDays: number;
  /** Days after "now" when the first milestone matures. */
  firstMilestoneOffsetDays: number;
  /** Grace window between the last milestone and treasury expiration. */
  expirationGraceDays: number;
}

export interface MilestoneEntry {
  maturation: Date;
  amountLovelace: bigint;
}

export interface ResolvedConfig {
  network: Network;
  adminAddress: string;
  adminPkhHex: string;
  amountLovelace: bigint;
  schedule: MilestoneEntry[];
  /** POSIX ms after which funds can be swept back to the Cardano treasury. */
  treasuryExpirationMs: bigint;
  /** POSIX ms: hard cap on any milestone maturation the committee may pick. */
  vendorPayoutUpperboundMs: bigint;
}

const MS_PER_DAY = 24n * 60n * 60n * 1000n;

/**
 * Extract the payment key hash (hex, 56 chars) from a Shelley base address.
 * Throws if the address has no payment part or if the payment part is not a
 * key hash.
 */
export function addressPaymentKeyHash(bech32: string): string {
  const addr = Core.Address.fromBech32(bech32);
  const payment = addr.getProps().paymentPart;
  if (!payment) {
    throw new Error(`Address ${bech32} has no payment part`);
  }
  if (payment.type !== Core.CredentialType.KeyHash) {
    throw new Error(
      `Address ${bech32} payment part is not a key hash (got ${payment.type})`,
    );
  }
  return payment.hash;
}

/**
 * Build an even milestone schedule from the raw config. The last milestone
 * absorbs any rounding remainder so total payouts exactly equal amountLovelace.
 */
export function resolveSchedule(
  raw: RawConfig,
  now: Date = new Date(),
): MilestoneEntry[] {
  if (raw.milestoneCount < 1 || raw.milestoneCount > 24) {
    throw new Error(
      `milestoneCount must be between 1 and 24 (got ${raw.milestoneCount})`,
    );
  }
  const per = raw.amountLovelace / BigInt(raw.milestoneCount);
  const remainder =
    raw.amountLovelace - per * BigInt(raw.milestoneCount);
  const baseMs = BigInt(now.getTime()) + BigInt(raw.firstMilestoneOffsetDays) * MS_PER_DAY;
  const entries: MilestoneEntry[] = [];
  for (let i = 0; i < raw.milestoneCount; i++) {
    const matMs = baseMs + BigInt(i) * BigInt(raw.milestoneSpacingDays) * MS_PER_DAY;
    const amount = i === raw.milestoneCount - 1 ? per + remainder : per;
    entries.push({
      maturation: new Date(Number(matMs)),
      amountLovelace: amount,
    });
  }
  return entries;
}

export function resolveConfig(raw: RawConfig, now: Date = new Date()): ResolvedConfig {
  const schedule = resolveSchedule(raw, now);
  const lastMs = BigInt(schedule[schedule.length - 1]!.maturation.getTime());
  const treasuryExpirationMs =
    lastMs + BigInt(raw.expirationGraceDays) * MS_PER_DAY;
  return {
    network: raw.network,
    adminAddress: raw.adminAddress,
    adminPkhHex: addressPaymentKeyHash(raw.adminAddress),
    amountLovelace: raw.amountLovelace,
    schedule,
    treasuryExpirationMs,
    vendorPayoutUpperboundMs: treasuryExpirationMs,
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `bun test params/common.test.ts`
Expected: PASS — 5/5 tests green.

Note: the exact script-payment address byte layout in the "rejects a
script-payment address" test may need adjustment. If the test fails because
the sample address parses with a `KeyHash` payment, substitute an
`addr_test1w...` enterprise-script address — payment part type is
`ScriptHash` by construction.

- [ ] **Step 5: Commit**

```bash
git add params/common.ts params/common.test.ts
git commit -m "feat: add param common types, address helper, schedule resolver"
```

---

## Task 4: Preprod params

**Files:**
- Create: `params/preprod.ts`
- Test: `params/preprod.test.ts`

- [ ] **Step 1: Write the failing test**

Create `/Users/nau/projects/lantr/scalus-treasury/params/preprod.test.ts`:

```typescript
import { describe, expect, test } from "bun:test";
import { preprodRawConfig, buildTreasuryConfig, buildVendorConfig } from "./preprod";
import { resolveConfig } from "./common";

const FIXED_NOW = new Date("2026-05-01T00:00:00Z");
const FAKE_REGISTRY_POLICY =
  "cafebabecafebabecafebabecafebabecafebabecafebabecafebabe";

describe("preprod raw config", () => {
  test("withdrawal amount is 1,000,000 tADA", () => {
    expect(preprodRawConfig.amountLovelace).toBe(1_000_000_000_000n);
  });

  test("single milestone configuration", () => {
    expect(preprodRawConfig.milestoneCount).toBe(1);
  });

  test("admin address matches the designated proposer address", () => {
    expect(preprodRawConfig.adminAddress).toBe(
      "addr_test1qzwg0u9fpl8dac9rkramkcgzerjsfdlqgkw0q8hy5vwk8tzk5pgcmdpe5jeh92guy4mke4zdmagv228nucldzxv95clq68fray",
    );
  });
});

describe("buildTreasuryConfig", () => {
  test("uses the supplied registry policy and resolved expiration", () => {
    const resolved = resolveConfig(preprodRawConfig, FIXED_NOW);
    const cfg = buildTreasuryConfig(resolved, FAKE_REGISTRY_POLICY);
    expect(cfg.registry_token).toBe(FAKE_REGISTRY_POLICY);
    expect(cfg.expiration).toBe(resolved.treasuryExpirationMs);
    expect(cfg.payout_upperbound).toBe(resolved.vendorPayoutUpperboundMs);
  });

  test("all four treasury permissions are a Signature over the admin pkh", () => {
    const resolved = resolveConfig(preprodRawConfig, FIXED_NOW);
    const cfg = buildTreasuryConfig(resolved, FAKE_REGISTRY_POLICY);
    for (const ms of [
      cfg.permissions.reorganize,
      cfg.permissions.sweep,
      cfg.permissions.fund,
      cfg.permissions.disburse,
    ]) {
      expect("Signature" in ms).toBe(true);
      if ("Signature" in ms) {
        expect(ms.Signature.key_hash).toBe(resolved.adminPkhHex);
      }
    }
  });
});

describe("buildVendorConfig", () => {
  test("registry + expiration match treasury; three permissions use admin", () => {
    const resolved = resolveConfig(preprodRawConfig, FIXED_NOW);
    const cfg = buildVendorConfig(resolved, FAKE_REGISTRY_POLICY);
    expect(cfg.registry_token).toBe(FAKE_REGISTRY_POLICY);
    expect(cfg.expiration).toBe(resolved.treasuryExpirationMs);
    for (const ms of [
      cfg.permissions.pause,
      cfg.permissions.resume,
      cfg.permissions.modify,
    ]) {
      expect("Signature" in ms).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run the test — expect failure**

Run: `bun test params/preprod.test.ts`
Expected: FAIL — `Cannot find module './preprod'`.

- [ ] **Step 3: Write the implementation**

Create `/Users/nau/projects/lantr/scalus-treasury/params/preprod.ts`:

```typescript
import type {
  MultisigScript,
  TreasuryConfiguration,
  VendorConfiguration,
} from "@sundaeswap/treasury-funds";
import type { RawConfig, ResolvedConfig } from "./common";

/**
 * Preprod concrete config. 1,000,000 tADA, single milestone, single admin key
 * (derived from the proposer address) used for every permission.
 */
export const preprodRawConfig: RawConfig = {
  network: "preprod",
  adminAddress:
    "addr_test1qzwg0u9fpl8dac9rkramkcgzerjsfdlqgkw0q8hy5vwk8tzk5pgcmdpe5jeh92guy4mke4zdmagv228nucldzxv95clq68fray",
  amountLovelace: 1_000_000_000_000n,
  milestoneCount: 1,
  milestoneSpacingDays: 30, // unused when milestoneCount === 1
  firstMilestoneOffsetDays: 30,
  expirationGraceDays: 180,
};

function adminSig(resolved: ResolvedConfig): MultisigScript {
  return { Signature: { key_hash: resolved.adminPkhHex } };
}

export function buildTreasuryConfig(
  resolved: ResolvedConfig,
  registryPolicyHex: string,
): TreasuryConfiguration {
  const sig = adminSig(resolved);
  return {
    registry_token: registryPolicyHex,
    permissions: {
      reorganize: sig,
      sweep: sig,
      fund: sig,
      disburse: sig,
    },
    expiration: resolved.treasuryExpirationMs,
    payout_upperbound: resolved.vendorPayoutUpperboundMs,
  };
}

export function buildVendorConfig(
  resolved: ResolvedConfig,
  registryPolicyHex: string,
): VendorConfiguration {
  const sig = adminSig(resolved);
  return {
    registry_token: registryPolicyHex,
    permissions: {
      pause: sig,
      resume: sig,
      modify: sig,
    },
    expiration: resolved.treasuryExpirationMs,
  };
}

/** The vendor multisig that gates claim-on-maturation. Same admin key. */
export function vendorMultisig(resolved: ResolvedConfig): MultisigScript {
  return adminSig(resolved);
}
```

- [ ] **Step 4: Run the tests**

Run: `bun test params/preprod.test.ts`
Expected: PASS — 5/5.

If `MultisigScript`'s `Signature` field shape from the published types
differs from `{ key_hash: string }` (tagged-union variants sometimes come
through as `{ Signature: [string] }` from blueprint codegen), adjust
`adminSig` and the matching test expectations together — the property under
test is "it's a Signature over the admin pkh", not the specific encoding.

- [ ] **Step 5: Commit**

```bash
git add params/preprod.ts params/preprod.test.ts
git commit -m "feat: add preprod params (1M tADA, single milestone, admin-only)"
```

---

## Task 5: Mainnet placeholder

**Files:**
- Create: `params/mainnet.ts`
- Test: `params/mainnet.test.ts`

- [ ] **Step 1: Write the failing test**

Create `/Users/nau/projects/lantr/scalus-treasury/params/mainnet.test.ts`:

```typescript
import { describe, expect, test } from "bun:test";
import { mainnetRawConfig } from "./mainnet";

describe("mainnet placeholder", () => {
  test("throws when evaluated, with a TODO hint", () => {
    expect(() => mainnetRawConfig()).toThrow(/TODO/);
  });
});
```

- [ ] **Step 2: Run the test — expect failure**

Run: `bun test params/mainnet.test.ts`
Expected: FAIL — `Cannot find module './mainnet'`.

- [ ] **Step 3: Write the implementation**

Create `/Users/nau/projects/lantr/scalus-treasury/params/mainnet.ts`:

```typescript
import type { RawConfig } from "./common";

/**
 * Mainnet placeholder. NOT runnable as-is — replace every TODO with the real
 * value from the finalized Scalus Application Platform and Node Diversity
 * proposal before attempting to deploy to mainnet.
 *
 * Wrapped in a function so that merely importing this module does not crash
 * the process; calling it is the explicit acknowledgement that you intend to
 * use the mainnet path.
 */
export function mainnetRawConfig(): RawConfig {
  throw new Error(
    "TODO(mainnet): fill in mainnet params — see params/mainnet.ts for fields required",
  );

  // Shape to fill in when the real proposal is drafted:
  // return {
  //   network: "mainnet",
  //   adminAddress: "addr1q...",            // TODO(mainnet): real committee multisig signer address (or remove single-admin model entirely)
  //   amountLovelace: 0n,                   // TODO(mainnet): final withdrawal amount
  //   milestoneCount: 0,                    // TODO(mainnet): milestone count (1..24)
  //   milestoneSpacingDays: 0,              // TODO(mainnet)
  //   firstMilestoneOffsetDays: 0,          // TODO(mainnet)
  //   expirationGraceDays: 180,             // TODO(mainnet): review with legal/ops
  // };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun test params/mainnet.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add params/mainnet.ts params/mainnet.test.ts
git commit -m "feat: add mainnet params placeholder that throws until filled"
```

---

## Task 6: Provider and deployment state libs

**Files:**
- Create: `scripts/lib/provider.ts`
- Create: `scripts/lib/deployment.ts`
- Test: `scripts/lib/deployment.test.ts`

- [ ] **Step 1: Write the provider module**

Create `/Users/nau/projects/lantr/scalus-treasury/scripts/lib/provider.ts`:

```typescript
import { Blockfrost } from "@blaze-cardano/blockfrost";
import { Blaze, HotWallet, NetworkId } from "@blaze-cardano/sdk";
import { Ed25519PrivateNormalKeyHex } from "@blaze-cardano/core";

export interface ProviderBundle {
  blaze: Blaze<Blockfrost, HotWallet>;
  network: NetworkId;
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.includes("REPLACE_ME")) {
    throw new Error(`Environment variable ${name} is not set. See .env.example.`);
  }
  return v;
}

/**
 * Build a Blaze instance for the configured network, with a hot wallet loaded
 * from ./keys/admin.skey. Keys are hex-encoded Ed25519 private keys (same
 * format cardano-cli uses when you export --out-file with --hex).
 */
export async function loadProvider(
  adminSkeyHex: string,
): Promise<ProviderBundle> {
  const net = requireEnv("NETWORK");
  if (net !== "preprod" && net !== "mainnet") {
    throw new Error(`Unsupported NETWORK=${net}; expected "preprod" or "mainnet"`);
  }
  const projectId = requireEnv("BLOCKFROST_PROJECT_ID");
  const network = net === "mainnet" ? NetworkId.Mainnet : NetworkId.Testnet;
  const provider = new Blockfrost({
    network: net === "mainnet" ? "cardano-mainnet" : "cardano-preprod",
    projectId,
  });
  const wallet = await HotWallet.fromMasterkey(
    Ed25519PrivateNormalKeyHex(adminSkeyHex),
    provider,
  );
  const blaze = await Blaze.from(provider, wallet);
  return { blaze, network };
}
```

- [ ] **Step 2: Write the failing test for deployment state**

Create `/Users/nau/projects/lantr/scalus-treasury/scripts/lib/deployment.test.ts`:

```typescript
import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  loadDeployment,
  saveDeployment,
  type DeploymentState,
} from "./deployment";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "scalus-treasury-"));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("deployment state", () => {
  test("loadDeployment returns null when no file exists", () => {
    expect(loadDeployment(join(dir, "missing.json"))).toBeNull();
  });

  test("round-trip save/load preserves bigint fields as strings and re-hydrates them", () => {
    const path = join(dir, "preprod.json");
    const state: DeploymentState = {
      network: "preprod",
      seedUtxo: { txId: "ab".repeat(32), outputIndex: 3 },
      registryPolicyHex: "de".repeat(28),
      registryAssetNameHex: "52454749535452590000000000000000000000000000000000000000",
      treasuryScriptHashHex: "ca".repeat(28),
      vendorScriptHashHex: "be".repeat(28),
      treasuryExpirationMs: 1_700_000_000_000n,
      txs: {},
    };
    saveDeployment(path, state);
    const loaded = loadDeployment(path);
    expect(loaded).toEqual(state);
  });

  test("saveDeployment refuses to overwrite unless overwrite=true", () => {
    const path = join(dir, "preprod.json");
    const state: DeploymentState = {
      network: "preprod",
      seedUtxo: { txId: "ab".repeat(32), outputIndex: 0 },
      registryPolicyHex: "",
      registryAssetNameHex: "",
      treasuryScriptHashHex: "",
      vendorScriptHashHex: "",
      treasuryExpirationMs: 0n,
      txs: {},
    };
    saveDeployment(path, state);
    expect(() => saveDeployment(path, state)).toThrow(/already exists/);
    // Passing explicit overwrite=true works.
    saveDeployment(path, state, { overwrite: true });
  });
});
```

- [ ] **Step 3: Run the test — expect failure**

Run: `bun test scripts/lib/deployment.test.ts`
Expected: FAIL — `Cannot find module './deployment'`.

- [ ] **Step 4: Write the deployment module**

Create `/Users/nau/projects/lantr/scalus-treasury/scripts/lib/deployment.ts`:

```typescript
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export interface SeedUtxo {
  txId: string;
  outputIndex: number;
}

export interface DeploymentState {
  network: "preprod" | "mainnet";
  seedUtxo: SeedUtxo;
  registryPolicyHex: string;
  /** "REGISTRY" as hex. */
  registryAssetNameHex: string;
  treasuryScriptHashHex: string;
  vendorScriptHashHex: string;
  treasuryExpirationMs: bigint;
  /** Named transaction hashes recorded as the flow progresses. */
  txs: Record<string, string>;
}

interface SerializedState extends Omit<DeploymentState, "treasuryExpirationMs"> {
  treasuryExpirationMs: string;
}

export function loadDeployment(path: string): DeploymentState | null {
  if (!existsSync(path)) return null;
  const raw = JSON.parse(readFileSync(path, "utf8")) as SerializedState;
  return {
    ...raw,
    treasuryExpirationMs: BigInt(raw.treasuryExpirationMs),
  };
}

export function saveDeployment(
  path: string,
  state: DeploymentState,
  opts: { overwrite?: boolean } = {},
): void {
  if (existsSync(path) && !opts.overwrite) {
    throw new Error(
      `Deployment state ${path} already exists. Pass { overwrite: true } to replace it.`,
    );
  }
  const serialized: SerializedState = {
    ...state,
    treasuryExpirationMs: state.treasuryExpirationMs.toString(),
  };
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(serialized, null, 2) + "\n", "utf8");
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `bun test scripts/lib/deployment.test.ts`
Expected: PASS — 3/3.

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/provider.ts scripts/lib/deployment.ts scripts/lib/deployment.test.ts
git commit -m "feat: add blaze provider loader and deployment state module"
```

---

## Task 7: Compiled-scripts loader

**Files:**
- Create: `scripts/lib/scripts.ts`
- Test: `scripts/lib/scripts.test.ts`

- [ ] **Step 1: Write the failing test**

Create `/Users/nau/projects/lantr/scalus-treasury/scripts/lib/scripts.test.ts`:

```typescript
import { describe, expect, test } from "bun:test";
import { NetworkId } from "@blaze-cardano/sdk";
import { preprodRawConfig, buildTreasuryConfig, buildVendorConfig } from "../../params/preprod";
import { resolveConfig } from "../../params/common";
import { compileScripts } from "./scripts";

describe("compileScripts", () => {
  test("produces stable script hashes for fixed inputs", () => {
    const resolved = resolveConfig(preprodRawConfig, new Date("2026-05-01T00:00:00Z"));
    const fakeRegistry = "cafebabecafebabecafebabecafebabecafebabecafebabecafebabe";
    const treasuryCfg = buildTreasuryConfig(resolved, fakeRegistry);
    const vendorCfg = buildVendorConfig(resolved, fakeRegistry);

    const a = compileScripts(NetworkId.Testnet, treasuryCfg, vendorCfg);
    const b = compileScripts(NetworkId.Testnet, treasuryCfg, vendorCfg);

    expect(a.treasury.scriptHashHex).toBe(b.treasury.scriptHashHex);
    expect(a.vendor.scriptHashHex).toBe(b.vendor.scriptHashHex);
    expect(a.treasury.scriptHashHex).toMatch(/^[0-9a-f]{56}$/);
    expect(a.vendor.scriptHashHex).toMatch(/^[0-9a-f]{56}$/);
    expect(a.treasury.scriptHashHex).not.toBe(a.vendor.scriptHashHex);
  });

  test("different registry token yields different script hashes", () => {
    const resolved = resolveConfig(preprodRawConfig, new Date("2026-05-01T00:00:00Z"));
    const reg1 = "ca".repeat(28);
    const reg2 = "ab".repeat(28);
    const a = compileScripts(
      NetworkId.Testnet,
      buildTreasuryConfig(resolved, reg1),
      buildVendorConfig(resolved, reg1),
    );
    const b = compileScripts(
      NetworkId.Testnet,
      buildTreasuryConfig(resolved, reg2),
      buildVendorConfig(resolved, reg2),
    );
    expect(a.treasury.scriptHashHex).not.toBe(b.treasury.scriptHashHex);
    expect(a.vendor.scriptHashHex).not.toBe(b.vendor.scriptHashHex);
  });
});
```

- [ ] **Step 2: Run the failing test**

Run: `bun test scripts/lib/scripts.test.ts`
Expected: FAIL — `Cannot find module './scripts'`.

- [ ] **Step 3: Write the script loader**

Create `/Users/nau/projects/lantr/scalus-treasury/scripts/lib/scripts.ts`:

```typescript
import { Utils, type TreasuryConfiguration, type VendorConfiguration } from "@sundaeswap/treasury-funds";
import { type Address } from "@blaze-cardano/core";
import { type NetworkId } from "@blaze-cardano/sdk";

export interface CompiledScriptView {
  scriptHashHex: string;
  address: Address;
}

export interface CompiledScripts {
  treasury: CompiledScriptView;
  vendor: CompiledScriptView;
}

/**
 * Compile both treasury and vendor scripts under the given network and
 * configs. Returns only the minimal derived data we need downstream
 * (hash + address). Full ICompiledScript objects are kept internal to
 * callers that need them via Utils.loadScripts directly.
 */
export function compileScripts(
  network: NetworkId,
  treasuryConfig: TreasuryConfiguration,
  vendorConfig: VendorConfiguration,
): CompiledScripts {
  const scripts = Utils.loadScripts(network, treasuryConfig, vendorConfig);
  return {
    treasury: {
      scriptHashHex: scripts.treasuryScript.script.Script.hash(),
      address: scripts.treasuryScript.scriptAddress,
    },
    vendor: {
      scriptHashHex: scripts.vendorScript.script.Script.hash(),
      address: scripts.vendorScript.scriptAddress,
    },
  };
}
```

- [ ] **Step 4: Run the tests**

Run: `bun test scripts/lib/scripts.test.ts`
Expected: PASS — 2/2.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/scripts.ts scripts/lib/scripts.test.ts
git commit -m "feat: add compiled-scripts loader wrapping sundae Utils.loadScripts"
```

---

## Task 8: Key generation script

**Files:**
- Create: `scripts/gen-keys.ts`

- [ ] **Step 1: Write the script**

Create `/Users/nau/projects/lantr/scalus-treasury/scripts/gen-keys.ts`:

```typescript
#!/usr/bin/env bun
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  Bip32PrivateKey,
  Ed25519PrivateKey,
  NetworkId,
  Core,
} from "@blaze-cardano/core";

/**
 * Generate keys/admin.skey (hex), keys/admin.vkey (hex), keys/admin.addr (bech32).
 * Preprod only. Idempotent: if admin.skey exists we do nothing.
 */
async function main(): Promise<void> {
  const base = resolve("keys");
  const skPath = `${base}/admin.skey`;
  const vkPath = `${base}/admin.vkey`;
  const addrPath = `${base}/admin.addr`;

  if (existsSync(skPath)) {
    console.log(`${skPath} already exists — keeping existing key`);
    return;
  }

  mkdirSync(base, { recursive: true });

  // 32 random bytes → Ed25519 private key.
  const seed = crypto.getRandomValues(new Uint8Array(32));
  const sk = Ed25519PrivateKey.fromNormalBytes(seed);
  const vk = sk.toPublic();
  const pkhHex = vk.hash().hex();

  const address = new Core.Address({
    type: Core.AddressType.EnterpriseKey,
    networkId: NetworkId.Testnet,
    paymentPart: {
      type: Core.CredentialType.KeyHash,
      hash: pkhHex,
    },
  });

  writeFileSync(skPath, sk.hex() + "\n", { mode: 0o600 });
  writeFileSync(vkPath, vk.hex() + "\n");
  writeFileSync(addrPath, address.toBech32() + "\n");

  console.log(`Wrote ${skPath}, ${vkPath}, ${addrPath}`);
  console.log(`Admin pkh: ${pkhHex}`);
  console.log(`Admin addr: ${address.toBech32()}`);
  console.log("");
  console.log("NOTE: Fund this address on preprod via the faucet:");
  console.log("  https://docs.cardano.org/cardano-testnets/tools/faucet");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 3: Smoke-test the script**

Run: `bun scripts/gen-keys.ts`
Expected: creates `keys/admin.skey`, `keys/admin.vkey`, `keys/admin.addr`; prints pkh + bech32 address; note the address is an *enterprise* (payment-only) address — sufficient to receive preprod faucet ADA and sign from.

Run again: `bun scripts/gen-keys.ts`
Expected: prints `already exists — keeping existing key`; no files changed.

- [ ] **Step 4: Commit**

```bash
git add scripts/gen-keys.ts
git commit -m "feat: add gen-keys script (idempotent preprod admin key generation)"
```

---

## Task 9: Initialize registry (mint one-shot NFT + publish datum)

**Files:**
- Create: `scripts/01-init-registry.ts`

- [ ] **Step 1: Write the script**

Create `/Users/nau/projects/lantr/scalus-treasury/scripts/01-init-registry.ts`:

```typescript
#!/usr/bin/env bun
import { readFileSync, existsSync } from "node:fs";
import {
  OneshotOneshotMint,
  ScriptHashRegistry,
  Utils,
} from "@sundaeswap/treasury-funds";
import { serialize, Void } from "@blaze-cardano/data";
import {
  AssetName,
  AuxiliaryData,
  Core,
  Datum,
  Ed25519KeyHashHex,
  NetworkId,
  PolicyId,
  TransactionInput,
  TransactionOutput,
  TransactionId,
  toHex,
} from "@blaze-cardano/core";
import { loadProvider } from "./lib/provider";
import { loadDeployment, saveDeployment, type DeploymentState } from "./lib/deployment";
import { preprodRawConfig, buildTreasuryConfig, buildVendorConfig } from "../params/preprod";
import { resolveConfig } from "../params/common";

const DEPLOYMENT_PATH = "deployment/preprod.json";
const DRY_RUN = !process.argv.includes("--submit");

async function main(): Promise<void> {
  if (preprodRawConfig.network !== "preprod") {
    throw new Error("This script is preprod-only.");
  }
  if (loadDeployment(DEPLOYMENT_PATH)) {
    console.log(`${DEPLOYMENT_PATH} already exists. Init already ran. Skipping.`);
    return;
  }

  const skHex = readFileSync("keys/admin.skey", "utf8").trim();
  const { blaze, network } = await loadProvider(skHex);
  if (network !== NetworkId.Testnet) {
    throw new Error(`Expected testnet network, got ${network}`);
  }

  // Pick any UTxO at the admin wallet to serve as the one-shot seed.
  const walletAddr = (await blaze.wallet.getUsedAddresses())[0];
  if (!walletAddr) throw new Error("Admin wallet has no addresses");
  const utxos = await blaze.provider.getUnspentOutputs(walletAddr);
  if (utxos.length === 0) {
    throw new Error(
      `Admin address has no UTxOs. Fund ${walletAddr.toBech32()} on preprod faucet first.`,
    );
  }
  const seed = utxos[0]!;
  const seedInput = seed.input();
  const seedUtxoData = {
    transaction_id: seedInput.transactionId(),
    output_index: seedInput.index(),
  };

  // Compile the oneshot minting policy parameterized by the seed UTxO.
  const oneshotScript = new OneshotOneshotMint(seedUtxoData);
  const registryPolicyHex = oneshotScript.Script.hash();
  const registryAssetNameHex = toHex(Buffer.from("REGISTRY"));

  const nowMs = new Date();
  const resolved = resolveConfig(preprodRawConfig, nowMs);
  const treasuryCfg = buildTreasuryConfig(resolved, registryPolicyHex);
  const vendorCfg = buildVendorConfig(resolved, registryPolicyHex);
  const compiled = Utils.loadScripts(network, treasuryCfg, vendorCfg);

  console.log(`Admin addr        : ${walletAddr.toBech32()}`);
  console.log(`Seed UTxO         : ${seedInput.transactionId()}#${seedInput.index()}`);
  console.log(`Registry policy   : ${registryPolicyHex}`);
  console.log(`Treasury script   : ${compiled.treasuryScript.script.Script.hash()}`);
  console.log(`Vendor   script   : ${compiled.vendorScript.script.Script.hash()}`);

  // The registry NFT lives at the oneshot policy's enterprise-script address
  // (always-fails spend → locked forever).
  const registryAddress = new Core.Address({
    type: Core.AddressType.EnterpriseScript,
    networkId: network,
    paymentPart: { type: Core.CredentialType.ScriptHash, hash: registryPolicyHex },
  });
  const registryDatum: ScriptHashRegistry = {
    treasury: { Script: [compiled.treasuryScript.script.Script.hash()] },
    vendor: { Script: [compiled.vendorScript.script.Script.hash()] },
  };
  const registryOutput = new TransactionOutput(
    registryAddress,
    Utils.contractsValueToCoreValue({
      [registryPolicyHex]: { [registryAssetNameHex]: 1n },
    }),
  );
  registryOutput.setDatum(
    Datum.fromCore(serialize(ScriptHashRegistry, registryDatum).toCore()),
  );

  const adminPkh = Ed25519KeyHashHex(resolved.adminPkhHex);

  const txBuilder = blaze
    .newTransaction()
    .addInput(seed)
    .addOutput(registryOutput)
    .addMint(
      PolicyId(registryPolicyHex),
      new Map<AssetName, bigint>([[AssetName(registryAssetNameHex), 1n]]),
      Void(),
    )
    .provideScript(oneshotScript.Script)
    .addRequiredSigner(adminPkh);

  const tx = await txBuilder.complete();

  console.log(`\nBuilt registry-init tx. CBOR length: ${tx.toCbor().toString().length / 2} bytes.`);

  if (DRY_RUN) {
    console.log("\n--dry-run (default): not submitting. Re-run with --submit to broadcast.");
    return;
  }

  const signed = await blaze.signTransaction(tx);
  const txHash = await blaze.provider.postTransactionToChain(signed);
  console.log(`Submitted. Tx hash: ${txHash}`);

  const state: DeploymentState = {
    network: "preprod",
    seedUtxo: {
      txId: seedInput.transactionId(),
      outputIndex: Number(seedInput.index()),
    },
    registryPolicyHex,
    registryAssetNameHex,
    treasuryScriptHashHex: compiled.treasuryScript.script.Script.hash(),
    vendorScriptHashHex: compiled.vendorScript.script.Script.hash(),
    treasuryExpirationMs: resolved.treasuryExpirationMs,
    txs: { initRegistry: txHash.toString() },
  };
  saveDeployment(DEPLOYMENT_PATH, state);
  console.log(`Wrote ${DEPLOYMENT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: PASS. If any import or property name does not exist on
`@sundaeswap/treasury-funds`, check the actual exported shape in
`node_modules/@sundaeswap/treasury-funds/dist/types/index.d.ts` (or in
`/Users/nau/projects/lantr/treasury-contracts/offchain/src/`) and adjust.
Real differences to watch for: the blueprint codegen sometimes renames
fields; e.g., `ScriptHashRegistry.treasury` may be `{ Script: [hash] }` or
`{ type: "Script", hash }`. Fix any divergences in one pass; do not work
around them.

- [ ] **Step 3: Dry-run against preprod (after funding the admin address)**

Prereq: `keys/admin.addr` funded via preprod faucet. Verify:
```bash
cat .env | grep BLOCKFROST_PROJECT_ID   # must be set
```
Run: `bun scripts/01-init-registry.ts`
Expected: prints admin addr, seed UTxO, computed policy/script hashes, tx
CBOR size, and "--dry-run (default): not submitting." Exits 0. Nothing is
written to `deployment/`.

- [ ] **Step 4: Submit for real**

Run: `bun scripts/01-init-registry.ts --submit`
Expected: prints "Submitted. Tx hash: …" and "Wrote deployment/preprod.json".
Re-running is a no-op ("Init already ran. Skipping.").

- [ ] **Step 5: Commit (code only; deployment file is gitignored)**

```bash
git add scripts/01-init-registry.ts
git commit -m "feat: add 01-init-registry — mint one-shot NFT and publish registry datum"
```

---

## Task 10: Register and delegate scripts to AlwaysAbstain

**Files:**
- Create: `scripts/02-register-scripts.ts`

- [ ] **Step 1: Write the script**

Create `/Users/nau/projects/lantr/scalus-treasury/scripts/02-register-scripts.ts`:

```typescript
#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import { Utils } from "@sundaeswap/treasury-funds";
import { Void } from "@blaze-cardano/data";
import {
  Core,
  Credential,
  CredentialType,
  Ed25519KeyHashHex,
  NetworkId,
  RewardAccount,
} from "@blaze-cardano/core";
import { loadProvider } from "./lib/provider";
import { loadDeployment, saveDeployment } from "./lib/deployment";
import { preprodRawConfig, buildTreasuryConfig, buildVendorConfig } from "../params/preprod";
import { resolveConfig } from "../params/common";

const DEPLOYMENT_PATH = "deployment/preprod.json";
const DRY_RUN = !process.argv.includes("--submit");

async function main(): Promise<void> {
  const state = loadDeployment(DEPLOYMENT_PATH);
  if (!state) throw new Error("Run 01-init-registry.ts --submit first.");

  const skHex = readFileSync("keys/admin.skey", "utf8").trim();
  const { blaze, network } = await loadProvider(skHex);
  if (network !== NetworkId.Testnet) throw new Error("Expected testnet");

  const resolved = resolveConfig(preprodRawConfig, new Date());
  const treasuryCfg = buildTreasuryConfig(resolved, state.registryPolicyHex);
  const vendorCfg = buildVendorConfig(resolved, state.registryPolicyHex);
  const scripts = Utils.loadScripts(network, treasuryCfg, vendorCfg);

  const adminPkh = Ed25519KeyHashHex(resolved.adminPkhHex);

  // Article IV §5: constitution requires scripts delegate voting power to
  // AlwaysAbstain so that treasury-held ADA does not influence governance.
  const alwaysAbstainDRep = { __typename: "AlwaysAbstain" as const };

  const treasuryCred: Credential.Core = {
    type: CredentialType.ScriptHash,
    hash: scripts.treasuryScript.script.Script.hash(),
  };
  const vendorCred: Credential.Core = {
    type: CredentialType.ScriptHash,
    hash: scripts.vendorScript.script.Script.hash(),
  };

  const tx = blaze.newTransaction();
  // Register both stake credentials (deposit = 2 ADA each) and delegate votes
  // to AlwaysAbstain. The Blaze API exposes `addRegisterStake` and
  // `addVoteDelegation`; combined certificates are emitted when supported.
  tx.addRegisterStake(treasuryCred);
  tx.addVoteDelegation(treasuryCred, alwaysAbstainDRep, Void());
  tx.addRegisterStake(vendorCred);
  tx.addVoteDelegation(vendorCred, alwaysAbstainDRep, Void());

  // The publish/certify purpose on both scripts requires the script witness.
  tx.provideScript(scripts.treasuryScript.script.Script);
  tx.provideScript(scripts.vendorScript.script.Script);
  tx.addRequiredSigner(adminPkh);

  const built = await tx.complete();

  console.log(
    `Built register+delegate tx. CBOR bytes: ${built.toCbor().toString().length / 2}`,
  );
  console.log(`  Treasury reward acct: ${RewardAccount.fromCredential(treasuryCred, network)}`);
  console.log(`  Vendor   reward acct: ${RewardAccount.fromCredential(vendorCred, network)}`);

  if (DRY_RUN) {
    console.log("\n--dry-run (default): not submitting. Re-run with --submit to broadcast.");
    return;
  }

  const signed = await blaze.signTransaction(built);
  const hash = await blaze.provider.postTransactionToChain(signed);
  console.log(`Submitted. Tx hash: ${hash}`);
  state.txs.registerScripts = hash.toString();
  saveDeployment(DEPLOYMENT_PATH, state, { overwrite: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`

Expected: PASS. Blaze's exact certificate-builder API may differ
(`addRegisterStakeCert`, `addDelegateVote`, etc.). If typecheck fails, open
`node_modules/@blaze-cardano/tx/dist/types/TxBuilder.d.ts` to find the
actual names for stake-registration and vote-delegation certificates, then
update this file — the *intent* is: register both script stake creds +
delegate both to `AlwaysAbstain` in one tx.

- [ ] **Step 3: Dry-run**

Run: `bun scripts/02-register-scripts.ts`
Expected: prints tx size + two reward accounts, exits 0 without submitting.

- [ ] **Step 4: Submit**

Run: `bun scripts/02-register-scripts.ts --submit`
Expected: prints tx hash; `deployment/preprod.json` now has `txs.registerScripts`.

- [ ] **Step 5: Commit**

```bash
git add scripts/02-register-scripts.ts
git commit -m "feat: add 02-register-scripts — register + delegate to AlwaysAbstain"
```

---

## Task 11: Build governance action JSON

**Files:**
- Create: `gov/anchor.json`
- Create: `scripts/03-build-gov-action.ts`

- [ ] **Step 1: Write the anchor stub**

Create `/Users/nau/projects/lantr/scalus-treasury/gov/anchor.json`:

```json
{
  "@context": {
    "@language": "en-us",
    "CIP100": "https://github.com/cardano-foundation/CIPs/blob/master/CIP-0100/README.md#",
    "CIP108": "https://github.com/cardano-foundation/CIPs/blob/master/CIP-0108/README.md#",
    "hashAlgorithm": "CIP100:hashAlgorithm",
    "body": "CIP108:body",
    "title": "CIP108:title",
    "abstract": "CIP108:abstract",
    "motivation": "CIP108:motivation",
    "rationale": "CIP108:rationale",
    "references": "CIP108:references"
  },
  "hashAlgorithm": "blake2b-256",
  "body": {
    "title": "Scalus Application Platform and Node Diversity",
    "abstract": "PREPROD STUB — see https://scalus.org for the real proposal text.",
    "motivation": "PREPROD STUB",
    "rationale": "PREPROD STUB",
    "references": [
      { "@type": "Other", "label": "Scalus", "uri": "https://scalus.org" }
    ]
  }
}
```

- [ ] **Step 2: Write the build script**

Create `/Users/nau/projects/lantr/scalus-treasury/scripts/03-build-gov-action.ts`:

```typescript
#!/usr/bin/env bun
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { Credential, CredentialType, NetworkId, RewardAccount } from "@blaze-cardano/core";
import { loadDeployment } from "./lib/deployment";
import { preprodRawConfig } from "../params/preprod";

const ANCHOR_PATH = "gov/anchor.json";
const ANCHOR_URL = "https://scalus.org";
const OUT_PATH = "gov/preprod-withdrawal.json";
const PROPOSER_ADDRESS = preprodRawConfig.adminAddress;

function main(): void {
  const state = loadDeployment("deployment/preprod.json");
  if (!state) throw new Error("Run 01-init-registry.ts --submit first.");

  const anchorBytes = readFileSync(ANCHOR_PATH);
  const anchorHash = createHash("blake2b512").update(anchorBytes).digest();
  // CIP-100 mandates blake2b-256 truncated: take first 32 bytes of blake2b-256.
  // Node doesn't expose blake2b-256 natively; prefer a dedicated library if
  // available. As a stable stand-in for preprod, use SHA-256 and clearly
  // document this in README. Mainnet MUST use blake2b-256 (add via a package
  // like `blakejs` at that time).
  const sha256Hex = createHash("sha256").update(anchorBytes).digest("hex");
  const anchorHashHex = sha256Hex; // preprod stub; see README "Security" note

  const treasuryRewardAccount = RewardAccount.fromCredential(
    {
      type: CredentialType.ScriptHash,
      hash: state.treasuryScriptHashHex,
    } satisfies Credential.Core,
    NetworkId.Testnet,
  );

  const action = {
    type: "treasuryWithdrawal",
    network: "preprod",
    amountLovelace: preprodRawConfig.amountLovelace.toString(),
    rewardAccount: treasuryRewardAccount.toString(),
    anchor: {
      url: ANCHOR_URL,
      dataHash: anchorHashHex,
      note: "preprod stub — hash is SHA-256 of local gov/anchor.json, not blake2b-256 of served content",
    },
    returnAddress: PROPOSER_ADDRESS,
  };

  mkdirSync("gov", { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(action, null, 2) + "\n");

  console.log(`Wrote ${OUT_PATH}`);
  console.log("");
  console.log("Submit with cardano-cli (adjust paths):");
  console.log("  cardano-cli conway governance action create-treasury-withdrawal \\");
  console.log("    --testnet \\");
  console.log(`    --governance-action-deposit $(cardano-cli conway query gov-state --testnet-magic 1 | jq '.currentPParams.govActionDeposit') \\`);
  console.log(`    --deposit-return-stake-address $(cardano-cli address info --address ${PROPOSER_ADDRESS} | jq -r '.address') \\`);
  console.log(`    --anchor-url ${ANCHOR_URL} \\`);
  console.log(`    --anchor-data-hash ${anchorHashHex} \\`);
  console.log(`    --funds-receiving-stake-address ${treasuryRewardAccount.toString()} \\`);
  console.log(`    --transfer ${preprodRawConfig.amountLovelace.toString()} \\`);
  console.log("    --out-file gov/action.draft");
  console.log("");
  console.log("Then build, sign, and submit a tx proposing the action.");
}

main();
```

- [ ] **Step 3: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 4: Run it**

Prereq: `deployment/preprod.json` exists (Task 9 Step 4 must have been completed).

Run: `bun scripts/03-build-gov-action.ts`
Expected: writes `gov/preprod-withdrawal.json`; prints the `cardano-cli`
invocation. `git status` shows `gov/preprod-withdrawal.json` as untracked
(we do not commit per-env generated gov actions).

- [ ] **Step 5: Update `.gitignore` to exclude generated gov outputs**

Edit `/Users/nau/projects/lantr/scalus-treasury/.gitignore`, add a new
section:
```
# generated governance-action JSONs (the committed anchor.json stays tracked)
gov/preprod-*.json
gov/mainnet-*.json
```

- [ ] **Step 6: Commit**

```bash
git add gov/anchor.json scripts/03-build-gov-action.ts .gitignore
git commit -m "feat: add 03-build-gov-action + preprod anchor stub"
```

---

## Task 12: Treasury withdraw

**Files:**
- Create: `scripts/04-withdraw.ts`

- [ ] **Step 1: Write the script**

Create `/Users/nau/projects/lantr/scalus-treasury/scripts/04-withdraw.ts`:

```typescript
#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import { Treasury, Utils } from "@sundaeswap/treasury-funds";
import { Ed25519KeyHashHex, NetworkId } from "@blaze-cardano/core";
import { loadProvider } from "./lib/provider";
import { loadDeployment, saveDeployment } from "./lib/deployment";
import { preprodRawConfig, buildTreasuryConfig, buildVendorConfig } from "../params/preprod";
import { resolveConfig } from "../params/common";

const DEPLOYMENT_PATH = "deployment/preprod.json";
const DRY_RUN = !process.argv.includes("--submit");

async function main(): Promise<void> {
  const state = loadDeployment(DEPLOYMENT_PATH);
  if (!state) throw new Error("Run 01-init-registry.ts --submit first.");

  const skHex = readFileSync("keys/admin.skey", "utf8").trim();
  const { blaze, network } = await loadProvider(skHex);
  if (network !== NetworkId.Testnet) throw new Error("Expected testnet");

  const resolved = resolveConfig(preprodRawConfig, new Date());
  const treasuryCfg = buildTreasuryConfig(resolved, state.registryPolicyHex);
  const vendorCfg = buildVendorConfig(resolved, state.registryPolicyHex);
  const adminPkh = Ed25519KeyHashHex(resolved.adminPkhHex);

  const tx = await Treasury.withdraw({
    blaze,
    configsOrScripts: { configs: { treasury: treasuryCfg, vendor: vendorCfg } },
    signers: [adminPkh],
    amount: preprodRawConfig.amountLovelace,
  });

  const built = await tx.complete();
  console.log(`Built treasury withdraw tx. CBOR bytes: ${built.toCbor().toString().length / 2}`);

  if (DRY_RUN) {
    console.log("\n--dry-run (default): not submitting. Re-run with --submit to broadcast.");
    return;
  }

  const signed = await blaze.signTransaction(built);
  const hash = await blaze.provider.postTransactionToChain(signed);
  console.log(`Submitted. Tx hash: ${hash}`);
  state.txs.treasuryWithdraw = hash.toString();
  saveDeployment(DEPLOYMENT_PATH, state, { overwrite: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Verify the actual Treasury.withdraw signature**

The argument shape above (`{ blaze, configsOrScripts, signers, amount }`)
reflects what we saw in fund.ts but `withdraw` may take different fields.

Run: `cat node_modules/@sundaeswap/treasury-funds/dist/types/treasury/withdraw/index.d.ts`
Expected: function signature with its exact argument interface. If
`amount` is named `lovelace` or `value`, adjust the call site accordingly.
Do not work around it with `as any`.

- [ ] **Step 3: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 4: Dry-run**

Prereq: the governance action from Task 11 has passed on preprod and the
1M tADA has been withdrawn into the treasury script's reward account.

Run: `bun scripts/04-withdraw.ts`
Expected: prints CBOR size, exits 0 without submitting. If the tx builder
fails because the reward account has no withdrawable ADA, the preceding
governance step has not yet ratified — wait for the epoch boundary.

- [ ] **Step 5: Submit**

Run: `bun scripts/04-withdraw.ts --submit`
Expected: tx hash printed, `deployment/preprod.json` gains
`txs.treasuryWithdraw`.

- [ ] **Step 6: Commit**

```bash
git add scripts/04-withdraw.ts
git commit -m "feat: add 04-withdraw — pull ADA from treasury reward account"
```

---

## Task 13: Fund the vendor contract

**Files:**
- Create: `scripts/05-fund-vendor.ts`

- [ ] **Step 1: Write the script**

Create `/Users/nau/projects/lantr/scalus-treasury/scripts/05-fund-vendor.ts`:

```typescript
#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import { Treasury, Utils } from "@sundaeswap/treasury-funds";
import { makeValue } from "@blaze-cardano/sdk";
import { Ed25519KeyHashHex, NetworkId, AssetId, toHex } from "@blaze-cardano/core";
import { loadProvider } from "./lib/provider";
import { loadDeployment, saveDeployment } from "./lib/deployment";
import { preprodRawConfig, buildTreasuryConfig, buildVendorConfig, vendorMultisig } from "../params/preprod";
import { resolveConfig } from "../params/common";

const DEPLOYMENT_PATH = "deployment/preprod.json";
const DRY_RUN = !process.argv.includes("--submit");

async function main(): Promise<void> {
  const state = loadDeployment(DEPLOYMENT_PATH);
  if (!state) throw new Error("Run 01-init-registry.ts --submit first.");

  const skHex = readFileSync("keys/admin.skey", "utf8").trim();
  const { blaze, network } = await loadProvider(skHex);
  if (network !== NetworkId.Testnet) throw new Error("Expected testnet");

  const resolved = resolveConfig(preprodRawConfig, new Date());
  const treasuryCfg = buildTreasuryConfig(resolved, state.registryPolicyHex);
  const vendorCfg = buildVendorConfig(resolved, state.registryPolicyHex);
  const adminPkh = Ed25519KeyHashHex(resolved.adminPkhHex);

  // Find the treasury UTxO containing the withdrawn funds.
  const scripts = Utils.loadScripts(network, treasuryCfg, vendorCfg);
  const treasuryUtxos = await blaze.provider.getUnspentOutputs(
    scripts.treasuryScript.scriptAddress,
  );
  const funded = treasuryUtxos.find(
    (u) => u.output().amount().coin() >= resolved.amountLovelace,
  );
  if (!funded) {
    throw new Error(
      `No treasury UTxO with >= ${resolved.amountLovelace} lovelace found. Did 04-withdraw --submit succeed?`,
    );
  }

  const schedule = resolved.schedule.map((m) => ({
    date: m.maturation,
    amount: makeValue(m.amountLovelace),
  }));

  const tx = await Treasury.fund({
    blaze,
    configsOrScripts: { configs: { treasury: treasuryCfg, vendor: vendorCfg } },
    input: funded,
    vendor: vendorMultisig(resolved),
    schedule,
    signers: [adminPkh],
  });

  const built = await tx.complete();
  console.log(`Built fund-vendor tx. CBOR bytes: ${built.toCbor().toString().length / 2}`);
  console.log(`Milestone count: ${schedule.length}`);
  for (const m of schedule) {
    console.log(`  matures ${m.date.toISOString()}: ${m.amount.coin()} lovelace`);
  }

  if (DRY_RUN) {
    console.log("\n--dry-run (default): not submitting. Re-run with --submit to broadcast.");
    return;
  }

  const signed = await blaze.signTransaction(built);
  const hash = await blaze.provider.postTransactionToChain(signed);
  console.log(`Submitted. Tx hash: ${hash}`);
  state.txs.fundVendor = hash.toString();
  saveDeployment(DEPLOYMENT_PATH, state, { overwrite: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: PASS. `Treasury.fund` args verified against the sibling repo
source; adjust if types drift.

- [ ] **Step 3: Dry-run**

Run: `bun scripts/05-fund-vendor.ts`
Expected: prints CBOR size + one milestone line (~30 days out, 1M tADA),
exits 0 without submitting.

- [ ] **Step 4: Submit**

Run: `bun scripts/05-fund-vendor.ts --submit`
Expected: tx hash printed; state updated.

- [ ] **Step 5: Commit**

```bash
git add scripts/05-fund-vendor.ts
git commit -m "feat: add 05-fund-vendor — lock milestone at vendor script"
```

---

## Task 14: Vendor withdraws the matured milestone

**Files:**
- Create: `scripts/06-vendor-withdraw.ts`

- [ ] **Step 1: Write the script**

Create `/Users/nau/projects/lantr/scalus-treasury/scripts/06-vendor-withdraw.ts`:

```typescript
#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import { Vendor, Utils } from "@sundaeswap/treasury-funds";
import { Ed25519KeyHashHex, NetworkId } from "@blaze-cardano/core";
import { loadProvider } from "./lib/provider";
import { loadDeployment, saveDeployment } from "./lib/deployment";
import { preprodRawConfig, buildTreasuryConfig, buildVendorConfig } from "../params/preprod";
import { resolveConfig } from "../params/common";

const DEPLOYMENT_PATH = "deployment/preprod.json";
const DRY_RUN = !process.argv.includes("--submit");

async function main(): Promise<void> {
  const state = loadDeployment(DEPLOYMENT_PATH);
  if (!state) throw new Error("Run 01-init-registry.ts --submit first.");

  const skHex = readFileSync("keys/admin.skey", "utf8").trim();
  const { blaze, network } = await loadProvider(skHex);
  if (network !== NetworkId.Testnet) throw new Error("Expected testnet");

  const resolved = resolveConfig(preprodRawConfig, new Date());
  const treasuryCfg = buildTreasuryConfig(resolved, state.registryPolicyHex);
  const vendorCfg = buildVendorConfig(resolved, state.registryPolicyHex);
  const adminPkh = Ed25519KeyHashHex(resolved.adminPkhHex);

  const scripts = Utils.loadScripts(network, treasuryCfg, vendorCfg);
  const vendorUtxos = await blaze.provider.getUnspentOutputs(
    scripts.vendorScript.scriptAddress,
  );
  if (vendorUtxos.length === 0) {
    throw new Error("No vendor UTxOs found — did 05-fund-vendor --submit succeed?");
  }

  // Use all vendor UTxOs belonging to our funded project. For the single-
  // milestone preprod flow this is exactly one.
  const tx = await Vendor.withdraw({
    blaze,
    configsOrScripts: { configs: { treasury: treasuryCfg, vendor: vendorCfg } },
    inputs: vendorUtxos,
    signers: [adminPkh],
    now: new Date(),
  });

  const built = await tx.complete();
  console.log(`Built vendor-withdraw tx. CBOR bytes: ${built.toCbor().toString().length / 2}`);

  if (DRY_RUN) {
    console.log("\n--dry-run (default): not submitting. Re-run with --submit to broadcast.");
    return;
  }

  const signed = await blaze.signTransaction(built);
  const hash = await blaze.provider.postTransactionToChain(signed);
  console.log(`Submitted. Tx hash: ${hash}`);
  state.txs.vendorWithdraw = hash.toString();
  saveDeployment(DEPLOYMENT_PATH, state, { overwrite: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Verify `Vendor.withdraw` signature**

Run: `cat node_modules/@sundaeswap/treasury-funds/dist/types/vendor/withdraw/index.d.ts`
Expected: see the actual signature. Pay attention to how it expects the
current-time / validity-range input (may be `now`, `validFromSlot`, or
similar). Adjust the call accordingly.

- [ ] **Step 3: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 4: Dry-run (only meaningful after milestone maturation)**

Run: `bun scripts/06-vendor-withdraw.ts`
Expected behavior in the 30-day window before maturation: the dry-run may
still build but the script would reject it on-chain. That's fine — the
dry-run is for tx construction, not on-chain semantics. After maturation,
the dry-run should still succeed and be a viable submit candidate.

- [ ] **Step 5: Submit (after ~30 days)**

Run: `bun scripts/06-vendor-withdraw.ts --submit`
Expected: admin wallet receives ~1M tADA; vendor UTxO consumed.

- [ ] **Step 6: Commit**

```bash
git add scripts/06-vendor-withdraw.ts
git commit -m "feat: add 06-vendor-withdraw — admin claims matured milestone"
```

---

## Task 15: Full-test smoke run

- [ ] **Step 1: Run all unit tests**

Run: `bun test`
Expected: all tests from Tasks 3–7 pass; no failures; no snapshot issues.

- [ ] **Step 2: Typecheck the whole repo**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 3: Sanity-check generated docs mention all scripts**

Inspect `README.md` "Quickstart" and confirm it names every `0X-*.ts`
script in order. Fix any drift.

- [ ] **Step 4: Update README with the actual preprod deployment hashes (after a real run)**

Once the full flow has run end-to-end on preprod, append a **Deployments**
section to `README.md`:
```markdown
## Deployments

### Preprod (2026-MM-DD)
- Registry policy: `<hex>`
- Treasury script hash: `<hex>`
- Vendor script hash: `<hex>`
- Init tx: `<hash>`
- Register tx: `<hash>`
- Withdraw tx: `<hash>`
- Fund tx: `<hash>`
- Vendor-withdraw tx: `<hash>`
```
Pull values from `deployment/preprod.json`.

- [ ] **Step 5: Final commit**

```bash
git add README.md
git commit -m "docs: record preprod deployment hashes"
```

---

## Self-review checklist (for plan author; already completed)

- [x] Spec coverage: every section in the spec (§repo layout, §preprod params,
  §mainnet placeholder, §gov flow, §deps, §git+docs) has at least one task.
- [x] No TODOs or "fill in details" in any *step*; TODOs are only in the
  mainnet placeholder file (intentional per spec).
- [x] Type consistency: `RawConfig`, `ResolvedConfig`, `DeploymentState`,
  `CompiledScripts`, and the `Utils` / `Treasury.fund` / `Vendor.withdraw`
  call sites use matching field names.
- [x] Every code step shows the exact code (no "similar to Task N").
- [x] Each task ends with a commit; commit messages follow conventional style.
- [x] Tests exist before implementation for every pure helper (Tasks 3, 4,
  5, 6, 7).
- [x] Operational scripts (Tasks 8–14) use `--dry-run` by default so no
  accidental submission.
