#!/usr/bin/env bun
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
// libsodium-wrappers-sumo ships no type declarations; narrow to what we use.
import sodiumDefault from "libsodium-wrappers-sumo";
const sodium = sodiumDefault as unknown as {
  ready: Promise<void>;
  to_hex: (input: Uint8Array) => string;
  crypto_generichash: (outlen: number, input: Uint8Array) => Uint8Array;
};
import {
  CredentialType,
  Hash28ByteBase16,
  RewardAccount,
} from "@blaze-cardano/core";
import { Core } from "@blaze-cardano/sdk";
import { loadDeployment } from "./lib/deployment";
import { requirePin } from "./lib/pinned";
import { preprodRawConfig } from "../params/preprod";

const ANCHOR_PATH = "gov/anchor.preprod.json";
const OUT_PATH = "gov/preprod-withdrawal.json";

async function main(): Promise<void> {
  await sodium.ready;

  const state = loadDeployment("deployment/preprod.json");
  if (!state) throw new Error("Run 01-init-registry.ts --submit first.");

  const anchorPin = requirePin("anchor");
  const anchorUrl = `ipfs://${anchorPin.cid}`;
  const anchorBytes = readFileSync(ANCHOR_PATH);

  // CIP-100 mandates blake2b-256 of the served anchor bytes.
  // crypto_generichash with outlen=32 and no key is blake2b-256.
  const anchorHashHex = sodium.to_hex(
    sodium.crypto_generichash(32, anchorBytes),
  );

  const treasuryRewardAccount = RewardAccount.fromCredential(
    {
      type: CredentialType.ScriptHash,
      hash: Hash28ByteBase16(state.treasuryScriptHashHex),
    },
    Core.NetworkId.Testnet,
  );

  const action = {
    type: "treasuryWithdrawal",
    network: "preprod",
    amountLovelace: preprodRawConfig.amountLovelace.toString(),
    rewardAccount: treasuryRewardAccount.toString(),
    anchor: {
      url: anchorUrl,
      dataHash: anchorHashHex,
    },
    returnAddress: preprodRawConfig.adminAddress,
  };

  mkdirSync("gov", { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(action, null, 2) + "\n");

  console.log(`Wrote ${OUT_PATH}`);
  console.log("");
  console.log("Submit with cardano-cli (Conway era, adjust paths to your setup):");
  console.log("");
  console.log("  cardano-cli conway governance action create-treasury-withdrawal \\");
  console.log("    --testnet \\");
  console.log("    --governance-action-deposit \\");
  console.log("      \"$(cardano-cli conway query gov-state --testnet-magic 1 \\");
  console.log("        | jq '.currentPParams.govActionDeposit')\" \\");
  console.log(
    "    --deposit-return-stake-address \"$(cat keys/admin.stake.addr)\" \\",
  );
  console.log(`    --anchor-url ${anchorUrl} \\`);
  console.log(`    --anchor-data-hash ${anchorHashHex} \\`);
  console.log(
    `    --funds-receiving-stake-address ${treasuryRewardAccount.toString()} \\`,
  );
  console.log(`    --transfer ${preprodRawConfig.amountLovelace.toString()} \\`);
  console.log("    --out-file gov/action.draft");
  console.log("");
  console.log("Then build, sign, and submit a tx that includes --proposal-file gov/action.draft");
  console.log("with --testnet-magic 1 (preprod magic).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
