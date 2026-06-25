#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import sodium from "libsodium-wrappers-sumo";
import { Utils } from "@sundaeswap/treasury-funds";
import { Void } from "@blaze-cardano/data";
import {
  Credential,
  CredentialType,
  Ed25519KeyHashHex,
  Ed25519PublicKey,
  Ed25519PublicKeyHex,
  Hash28ByteBase16,
  RewardAccount,
} from "@blaze-cardano/core";
import { Core } from "@blaze-cardano/sdk";
import { loadProvider } from "./lib/provider";
import { loadDeployment, saveDeployment } from "./lib/deployment";
import { buildTreasuryConfig, buildVendorConfig } from "../params/preprod";
import { resolveConfig } from "../params/common";
import { selectRawConfig } from "../params/select";
import { mainnetRawConfig } from "../params/mainnet";
import {
  manualEvaluator,
  shouldUseManualEvaluator,
} from "./lib/manual-evaluator";

// Mainnet is intentionally out of params/select.ts; dispatch explicitly so
// the mainnet path is visible at the import site of this script.
const rawConfig =
  process.env.NETWORK === "mainnet" ? mainnetRawConfig() : selectRawConfig();
const DEPLOYMENT_PATH = `deployment/${rawConfig.network}.json`;
const DRY_RUN = !process.argv.includes("--submit");

// Blockfrost project IDs are network-scoped; the URL prefix must match.
const BLOCKFROST_BASE = `https://cardano-${rawConfig.network}.blockfrost.io/api/v0`;

/**
 * Whether a stake credential is already registered on-chain. The admin
 * stake key is registered once and persists across proposal cycles (a
 * reward withdrawal does NOT deregister it), so a fresh deployment must
 * NOT re-register it — `StakeKeyRegisteredDELEG` would reject the tx.
 * Uses Blockfrost's `registered` flag (not `active`, which only reflects
 * pool delegation this epoch — the admin stake is registered WITHOUT
 * pool delegation, so `active` is false even when registered). 404 =
 * never seen = not registered.
 */
async function isStakeRegistered(stakeBech32: string): Promise<boolean> {
  const projectId = process.env.BLOCKFROST_PROJECT_ID;
  if (!projectId) throw new Error("BLOCKFROST_PROJECT_ID not set");
  const resp = await fetch(`${BLOCKFROST_BASE}/accounts/${stakeBech32}`, {
    headers: { project_id: projectId },
  });
  if (resp.status === 404) return false;
  if (!resp.ok) {
    throw new Error(`Blockfrost account ${resp.status}: ${await resp.text()}`);
  }
  const j = (await resp.json()) as { registered?: boolean; active?: boolean };
  return j.registered === true || j.active === true;
}

async function main(): Promise<void> {
  await sodium.ready;

  const state = loadDeployment(DEPLOYMENT_PATH);
  if (!state) throw new Error("Run 01-init-registry.ts --submit first.");

  const skHex = readFileSync("keys/admin.skey", "utf8").trim();
  const { blaze, network } = await loadProvider(skHex);
  const expectedNetwork =
    rawConfig.network === "mainnet"
      ? Core.NetworkId.Mainnet
      : Core.NetworkId.Testnet;
  if (network !== expectedNetwork) {
    throw new Error(
      `Network mismatch: provider gave ${network}, params says ${rawConfig.network}`,
    );
  }

  const resolved = resolveConfig(rawConfig);
  const treasuryCfg = buildTreasuryConfig(resolved, state.registryPolicyHex);
  const vendorCfg = buildVendorConfig(resolved, state.registryPolicyHex);
  // trace=true selects the stripped (production) bytecode in the
  // patched @sundaeswap/treasury-funds package. Without this we'd ship
  // the trace-bloated variant, which pushes vendor over the 16 KB
  // max-tx-size cap. See scripts/patch-sundae.ts.
  const scripts = Utils.loadScripts(network, treasuryCfg, vendorCfg, true);
  const adminPkh = Ed25519KeyHashHex(resolved.adminPkhHex);

  const treasuryHash = scripts.treasuryScript.script.Script.hash();
  const vendorHash = scripts.vendorScript.script.Script.hash();

  const treasuryCred = Credential.fromCore({
    type: CredentialType.ScriptHash,
    hash: Hash28ByteBase16(treasuryHash),
  });
  const vendorCred = Credential.fromCore({
    type: CredentialType.ScriptHash,
    hash: Hash28ByteBase16(vendorHash),
  });

  // Admin stake credential — registered (no delegation) so the gov-action
  // deposit refund (~100k tADA on ratify or expire) lands in a usable
  // reward account. Personal stake, not treasury-held, so AlwaysAbstain
  // does not apply.
  const stakeVkHex = readFileSync("keys/admin.stake.vkey", "utf8").trim();
  const adminStakeVk = Ed25519PublicKey.fromHex(Ed25519PublicKeyHex(stakeVkHex));
  const adminStakePkhHex = (await adminStakeVk.hash()).hex();
  const adminStakeCred = Credential.fromCore({
    type: CredentialType.KeyHash,
    hash: Hash28ByteBase16(adminStakePkhHex),
  });

  // Article IV §5 of the Cardano constitution requires treasury-held ADA
  // to delegate voting power to AlwaysAbstain so the funds never
  // influence governance. Admin stake (gov-action deposit refund) is
  // registered without delegation; the operator can delegate to a real
  // DRep later if they want voting rights.
  const adminStakeReward = RewardAccount.fromCredential(
    { type: CredentialType.KeyHash, hash: Hash28ByteBase16(adminStakePkhHex) },
    network,
  );
  const adminAlreadyRegistered = await isStakeRegistered(
    adminStakeReward.toString(),
  );
  if (adminAlreadyRegistered) {
    console.log(
      `  Admin stake ${adminStakeReward} already registered — skipping its registration cert.`,
    );
  }

  const tx = blaze.newTransaction();
  tx.addRegisterStake(treasuryCred);
  tx.addVoteDelegation(treasuryCred, "alwaysAbstain", Void());
  tx.addRegisterStake(vendorCred);
  tx.addVoteDelegation(vendorCred, "alwaysAbstain", Void());
  if (!adminAlreadyRegistered) tx.addRegisterStake(adminStakeCred);
  tx.provideScript(scripts.treasuryScript.script.Script);
  tx.provideScript(scripts.vendorScript.script.Script);
  tx.addRequiredSigner(adminPkh);

  if (shouldUseManualEvaluator()) {
    console.log(
      "SKIP_EVAL=1 — using manual evaluator (Blockfrost preview eval is broken)",
    );
    tx.useEvaluator(manualEvaluator());
  }

  const built = await tx.complete();

  const treasuryReward = RewardAccount.fromCredential(
    { type: CredentialType.ScriptHash, hash: Hash28ByteBase16(treasuryHash) },
    network,
  );
  const vendorReward = RewardAccount.fromCredential(
    { type: CredentialType.ScriptHash, hash: Hash28ByteBase16(vendorHash) },
    network,
  );

  console.log(
    `Built register+delegate tx. CBOR size: ${built.toCbor().toString().length / 2} bytes`,
  );
  console.log(`  Treasury reward acct: ${treasuryReward}`);
  console.log(`  Vendor   reward acct: ${vendorReward}`);
  console.log(`  Admin    reward acct: ${adminStakeReward}`);

  if (DRY_RUN) {
    console.log(
      "\n--dry-run (default): not submitting. Re-run with --submit to broadcast.",
    );
    return;
  }

  const signed = await blaze.signTransaction(built);
  const hash = await blaze.submitTransaction(signed);
  console.log(`Submitted. Tx hash: ${hash}`);
  state.txs.registerScripts = hash.toString();
  saveDeployment(DEPLOYMENT_PATH, state, { overwrite: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
