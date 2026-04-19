#!/usr/bin/env bun
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import {
  CredentialType,
  Hash28ByteBase16,
  RewardAccount,
} from "@blaze-cardano/core";
import { Core } from "@blaze-cardano/sdk";
import { loadDeployment } from "./lib/deployment";
import { preprodRawConfig } from "../params/preprod";

const ANCHOR_PATH = "gov/anchor.json";
const ANCHOR_URL = "https://scalus.org";
const OUT_PATH = "gov/preprod-withdrawal.json";

function main(): void {
  const state = loadDeployment("deployment/preprod.json");
  if (!state) throw new Error("Run 01-init-registry.ts --submit first.");

  const anchorBytes = readFileSync(ANCHOR_PATH);

  // CIP-100 mandates blake2b-256 of the served anchor bytes. We do not
  // currently depend on a blake2b implementation, so for the preprod stub we
  // use SHA-256 and clearly document that the URL and hash need not agree
  // with served content. Mainnet MUST replace this with blake2b-256.
  const anchorHashHex = createHash("sha256")
    .update(anchorBytes)
    .digest("hex");

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
      url: ANCHOR_URL,
      dataHash: anchorHashHex,
      note:
        "preprod stub — hash is SHA-256 of local gov/anchor.json, not blake2b-256 of served content",
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
    `    --deposit-return-stake-address-bech32 ${preprodRawConfig.adminAddress} \\`,
  );
  console.log(`    --anchor-url ${ANCHOR_URL} \\`);
  console.log(`    --anchor-data-hash ${anchorHashHex} \\`);
  console.log(
    `    --funds-receiving-stake-address ${treasuryRewardAccount.toString()} \\`,
  );
  console.log(`    --transfer ${preprodRawConfig.amountLovelace.toString()} \\`);
  console.log("    --out-file gov/action.draft");
  console.log("");
  console.log("Then build, sign, and submit a tx that includes --proposal-file gov/action.draft.");
}

main();
