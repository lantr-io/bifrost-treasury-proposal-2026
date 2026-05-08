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
  Cardano,
  CredentialType,
  Ed25519KeyHashHex,
  Hash28ByteBase16,
  Hash32ByteBase16,
  HexBlob,
  PlutusV3Script,
  Redeemer,
  RedeemerPurpose,
  RewardAccount,
  Script,
} from "@blaze-cardano/core";
import { Void } from "@blaze-cardano/data";
import { Core } from "@blaze-cardano/sdk";
import { loadProvider } from "./lib/provider";
import { loadDeployment, saveDeployment } from "./lib/deployment";
import { requirePin } from "./lib/pinned";
import { preprodRawConfig } from "../params/preprod";
import { resolveConfig } from "../params/common";

const DEPLOYMENT_PATH = "deployment/preprod.json";
const ANCHOR_PATH = "gov/anchor.preprod.json";
const OUT_PATH = "gov/preprod-withdrawal.json";
const SUBMIT = process.argv.includes("--submit");

async function fetchGovActionDeposit(): Promise<bigint> {
  const projectId = process.env.BLOCKFROST_PROJECT_ID;
  if (!projectId) throw new Error("BLOCKFROST_PROJECT_ID not set");
  const resp = await fetch(
    "https://cardano-preprod.blockfrost.io/api/v0/epochs/latest/parameters",
    { headers: { project_id: projectId } },
  );
  if (!resp.ok) {
    throw new Error(`Blockfrost params ${resp.status}: ${await resp.text()}`);
  }
  const j = (await resp.json()) as { gov_action_deposit: string };
  return BigInt(j.gov_action_deposit);
}

async function fetchScriptCbor(scriptHash: string): Promise<string> {
  const projectId = process.env.BLOCKFROST_PROJECT_ID;
  if (!projectId) throw new Error("BLOCKFROST_PROJECT_ID not set");
  const resp = await fetch(
    `https://cardano-preprod.blockfrost.io/api/v0/scripts/${scriptHash}/cbor`,
    { headers: { project_id: projectId } },
  );
  if (!resp.ok) {
    throw new Error(
      `Blockfrost script ${scriptHash} ${resp.status}: ${await resp.text()}`,
    );
  }
  const j = (await resp.json()) as { cbor: string };
  // Blockfrost serves the script CBOR as `bytes(flat_uplc)` (single-wrap).
  // Blaze's PlutusV3Script.fromCbor expects double-wrap — `bytes(bytes(flat_uplc))`
  // — because that's the on-chain witness encoding it hashes from. Add one
  // more CBOR `bytes(...)` header so Blaze produces the expected hash.
  const innerLen = j.cbor.length / 2;
  let header: string;
  if (innerLen < 256) header = "58" + innerLen.toString(16).padStart(2, "0");
  else if (innerLen < 65536) header = "59" + innerLen.toString(16).padStart(4, "0");
  else header = "5a" + innerLen.toString(16).padStart(8, "0");
  return header + j.cbor;
}

async function main(): Promise<void> {
  await sodium.ready;

  const state = loadDeployment(DEPLOYMENT_PATH);
  if (!state) throw new Error("Run 01-init-registry.ts --submit first.");

  const resolved = resolveConfig(preprodRawConfig);

  const anchorPin = requirePin("anchor");
  const anchorUrl = `ipfs://${anchorPin.cid}`;
  const anchorBytes = readFileSync(ANCHOR_PATH);
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

  // Always emit the human-readable summary JSON.
  const action = {
    type: "treasuryWithdrawal",
    network: "preprod",
    amountLovelace: preprodRawConfig.amountLovelace.toString(),
    rewardAccount: treasuryRewardAccount.toString(),
    anchor: { url: anchorUrl, dataHash: anchorHashHex },
    returnAddress: resolved.adminAddress,
  };
  mkdirSync("gov", { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(action, null, 2) + "\n");
  console.log(`Wrote ${OUT_PATH}`);

  if (!SUBMIT) {
    console.log("");
    console.log(
      "--dry-run (default): not submitting. Re-run with --submit to broadcast",
    );
    console.log("via Blaze + Blockfrost.");
    console.log("");
    console.log(
      "Equivalent cardano-cli flow (requires a synced node socket; we use Blaze instead):",
    );
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
    return;
  }

  // Submit via Blaze.
  const skHex = readFileSync("keys/admin.skey", "utf8").trim();
  const { blaze, network } = await loadProvider(skHex);
  if (network !== Core.NetworkId.Testnet) throw new Error("Expected testnet");

  const deposit = await fetchGovActionDeposit();
  console.log(
    `gov_action_deposit (live from Blockfrost): ${deposit} lovelace ` +
      `(${(Number(deposit) / 1_000_000).toFixed(0)} tADA)`,
  );

  const depositReturnReward = readFileSync(
    "keys/admin.stake.addr",
    "utf8",
  ).trim() as Cardano.RewardAccount;

  // Preprod constitution's guardrails script hash. Conway requires every
  // treasury_withdrawals_action to reference this hash, so the CC-elected
  // guardrails script gets a chance to validate the proposal. The value
  // is committed to chain via the active constitution; verify with
  //   cardano-cli conway query constitution --testnet-magic 1
  // when a node socket is available. Currently
  //   fa24fb305126805cf2164c161d852a0e7330cf988f1fe558cf7d4a64
  // (matches the InvalidGuardrailsScriptHash error returned when this
  // field was null).
  const guardrailsScriptHash = Hash28ByteBase16(
    "fa24fb305126805cf2164c161d852a0e7330cf988f1fe558cf7d4a64",
  );
  const governanceAction: Cardano.GovernanceAction = {
    __typename: Cardano.GovernanceActionType.treasury_withdrawals_action,
    withdrawals: new Set([
      {
        rewardAccount: treasuryRewardAccount.toString() as Cardano.RewardAccount,
        coin: preprodRawConfig.amountLovelace,
      },
    ]),
    policyHash: guardrailsScriptHash,
  };

  const adminPkh = Ed25519KeyHashHex(resolved.adminPkhHex);

  // Conway treasury withdrawals run the constitution's guardrails script
  // (`policyHash` above) with `Proposing` purpose. Provide the script
  // bytes as a witness so the ledger can evaluate it. Blockfrost serves
  // the CBOR of any on-chain script by hash — fetch it on demand.
  const guardrailsCbor = await fetchScriptCbor(guardrailsScriptHash);
  const guardrailsScript = Script.newPlutusV3Script(
    PlutusV3Script.fromCbor(HexBlob(guardrailsCbor)),
  );

  const tx = blaze.newTransaction();
  tx.addProposal({
    deposit,
    rewardAccount: depositReturnReward,
    governanceAction,
    anchor: {
      url: anchorUrl,
      dataHash: Hash32ByteBase16(anchorHashHex),
    },
  });
  tx.provideScript(guardrailsScript);

  // Blaze's addProposal doesn't wire up a Proposing redeemer or register
  // the policyHash script as required. Do it manually before complete()
  // so evaluation can size the ExUnits. ExUnits set generously here;
  // complete() re-runs the script and adjusts. The proposal index is 0
  // because this tx has exactly one proposal procedure.
  const txAny = tx as unknown as {
    requiredPlutusScripts: Set<string>;
    redeemers: { values(): Redeemer[]; setValues(rs: Redeemer[]): void };
  };
  txAny.requiredPlutusScripts.add(guardrailsScriptHash);
  const redeemers = [...txAny.redeemers.values()];
  redeemers.push(
    Redeemer.fromCore({
      index: 0,
      purpose: RedeemerPurpose.propose,
      data: Void().toCore(),
      executionUnits: { memory: 2_000_000, steps: 500_000_000 },
    }),
  );
  txAny.redeemers.setValues(redeemers);

  tx.addRequiredSigner(adminPkh);

  const built = await tx.complete();
  console.log(
    `Built gov-action submission tx. CBOR size: ${built.toCbor().toString().length / 2} bytes`,
  );
  console.log(`  Anchor URL : ${anchorUrl}`);
  console.log(`  Anchor hash: ${anchorHashHex}`);
  console.log(`  Withdraw to: ${treasuryRewardAccount.toString()}`);
  console.log(`  Amount     : ${preprodRawConfig.amountLovelace} lovelace`);
  console.log(`  Deposit    : ${deposit} lovelace (returned to ${depositReturnReward})`);

  const signed = await blaze.signTransaction(built);
  const hash = await blaze.submitTransaction(signed);
  console.log(`Submitted. Tx hash: ${hash}`);
  state.txs.govAction = hash.toString();
  saveDeployment(DEPLOYMENT_PATH, state, { overwrite: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
