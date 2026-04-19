#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import sodium from "libsodium-wrappers-sumo";
import { Utils } from "@sundaeswap/treasury-funds";
import { Void } from "@blaze-cardano/data";
import {
  Credential,
  CredentialType,
  Ed25519KeyHashHex,
  Hash28ByteBase16,
  RewardAccount,
} from "@blaze-cardano/core";
import { Core } from "@blaze-cardano/sdk";
import { loadProvider } from "./lib/provider";
import { loadDeployment, saveDeployment } from "./lib/deployment";
import {
  preprodRawConfig,
  buildTreasuryConfig,
  buildVendorConfig,
} from "../params/preprod";
import { resolveConfig } from "../params/common";

const DEPLOYMENT_PATH = "deployment/preprod.json";
const DRY_RUN = !process.argv.includes("--submit");

async function main(): Promise<void> {
  await sodium.ready;

  const state = loadDeployment(DEPLOYMENT_PATH);
  if (!state) throw new Error("Run 01-init-registry.ts --submit first.");

  const skHex = readFileSync("keys/admin.skey", "utf8").trim();
  const { blaze, network } = await loadProvider(skHex);
  if (network !== Core.NetworkId.Testnet) throw new Error("Expected testnet");

  const resolved = resolveConfig(preprodRawConfig, new Date());
  const treasuryCfg = buildTreasuryConfig(resolved, state.registryPolicyHex);
  const vendorCfg = buildVendorConfig(resolved, state.registryPolicyHex);
  const scripts = Utils.loadScripts(network, treasuryCfg, vendorCfg);
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

  // Article IV §5 of the Cardano constitution requires treasury-held ADA to
  // delegate voting power to AlwaysAbstain so the funds never influence
  // governance.
  const tx = blaze.newTransaction();
  tx.addRegisterStake(treasuryCred);
  tx.addVoteDelegation(treasuryCred, "alwaysAbstain", Void());
  tx.addRegisterStake(vendorCred);
  tx.addVoteDelegation(vendorCred, "alwaysAbstain", Void());
  tx.provideScript(scripts.treasuryScript.script.Script);
  tx.provideScript(scripts.vendorScript.script.Script);
  tx.addRequiredSigner(adminPkh);

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
