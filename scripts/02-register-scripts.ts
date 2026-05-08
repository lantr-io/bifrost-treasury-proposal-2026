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

  const resolved = resolveConfig(preprodRawConfig);
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
  const tx = blaze.newTransaction();
  tx.addRegisterStake(treasuryCred);
  tx.addVoteDelegation(treasuryCred, "alwaysAbstain", Void());
  tx.addRegisterStake(vendorCred);
  tx.addVoteDelegation(vendorCred, "alwaysAbstain", Void());
  tx.addRegisterStake(adminStakeCred);
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
  const adminStakeReward = RewardAccount.fromCredential(
    { type: CredentialType.KeyHash, hash: Hash28ByteBase16(adminStakePkhHex) },
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
