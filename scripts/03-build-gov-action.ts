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
  Ed25519PublicKey,
  Ed25519PublicKeyHex,
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
import { selectRawConfig } from "../params/select";
import { mainnetRawConfig } from "../params/mainnet";
import { resolveConfig } from "../params/common";
import {
  manualEvaluator,
  shouldUseManualEvaluator,
} from "./lib/manual-evaluator";

// Mainnet is intentionally out of params/select.ts; dispatch explicitly so
// the mainnet path is visible at the import site of this script.
const rawConfig =
  process.env.NETWORK === "mainnet" ? mainnetRawConfig() : selectRawConfig();
const DEPLOYMENT_PATH = `deployment/${rawConfig.network}.json`;
const ANCHOR_PATH = `gov/anchor.${rawConfig.network}.json`;
const OUT_PATH = `gov/${rawConfig.network}-withdrawal.json`;
const SUBMIT = process.argv.includes("--submit");

// Blockfrost project IDs are network-scoped, so the URL prefix MUST match the
// project ID's network. Mirrors the same dispatch in scripts/lib/provider.ts.
const BLOCKFROST_BASE = `https://cardano-${rawConfig.network}.blockfrost.io/api/v0`;

async function fetchGovActionDeposit(): Promise<bigint> {
  const projectId = process.env.BLOCKFROST_PROJECT_ID;
  if (!projectId) throw new Error("BLOCKFROST_PROJECT_ID not set");
  const resp = await fetch(`${BLOCKFROST_BASE}/epochs/latest/parameters`, {
    headers: { project_id: projectId },
  });
  if (!resp.ok) {
    throw new Error(`Blockfrost params ${resp.status}: ${await resp.text()}`);
  }
  const j = (await resp.json()) as { gov_action_deposit: string };
  return BigInt(j.gov_action_deposit);
}

async function fetchScriptCbor(scriptHash: string): Promise<string> {
  const projectId = process.env.BLOCKFROST_PROJECT_ID;
  if (!projectId) throw new Error("BLOCKFROST_PROJECT_ID not set");
  const resp = await fetch(`${BLOCKFROST_BASE}/scripts/${scriptHash}/cbor`, {
    headers: { project_id: projectId },
  });
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

  const resolved = resolveConfig(rawConfig);

  const anchorPin = requirePin("anchor");
  // `ipfs://<cid>` matches the empirical mainnet norm: ~90% of the last 30
  // mainnet proposals (epoch 624-630) use `ipfs://` and all parse cleanly
  // per dbsync. Earlier hypothesis that `ipfs://` itself causes "Invalid
  // metadata" was preprod-only — mainnet's offchain fetcher resolves
  // ipfs:// fine. body.references[] uses https://ipfs.io/ipfs/<cid> for
  // direct click-through; the anchor URL itself is content-addressed and
  // any IPFS resolver returns the same bytes. See CLAUDE.md Gotchas.
  const anchorUrl = `ipfs://${anchorPin.cid}`;
  const anchorBytes = readFileSync(ANCHOR_PATH);
  const anchorHashHex = sodium.to_hex(
    sodium.crypto_generichash(32, anchorBytes),
  );

  const networkId =
    rawConfig.network === "mainnet"
      ? Core.NetworkId.Mainnet
      : Core.NetworkId.Testnet;
  const treasuryRewardAccount = RewardAccount.fromCredential(
    {
      type: CredentialType.ScriptHash,
      hash: Hash28ByteBase16(state.treasuryScriptHashHex),
    },
    networkId,
  );

  // Derive the deposit-return reward address from the stake vkey + the
  // resolved network. keys/admin.stake.addr is written by gen-keys.ts in
  // testnet bech32 form (stake_test1u…), so reading it directly would
  // smuggle a testnet address into a mainnet tx — the ledger rejects with
  // ProposalProcedureNetworkIdMismatch. Reconstruct on the fly instead.
  const stakeVkHex = readFileSync("keys/admin.stake.vkey", "utf8").trim();
  const adminStakeVk = Ed25519PublicKey.fromHex(Ed25519PublicKeyHex(stakeVkHex));
  const adminStakePkhHex = (await adminStakeVk.hash()).hex();
  const depositReturnReward = RewardAccount.fromCredential(
    { type: CredentialType.KeyHash, hash: Hash28ByteBase16(adminStakePkhHex) },
    networkId,
  );

  // Always emit the human-readable summary JSON.
  const action = {
    type: "treasuryWithdrawal",
    network: rawConfig.network,
    amountLovelace: rawConfig.amountLovelace.toString(),
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
    const netFlag =
      rawConfig.network === "mainnet"
        ? "--mainnet"
        : `--testnet-magic ${rawConfig.network === "preview" ? 2 : 1}`;
    console.log("  cardano-cli conway governance action create-treasury-withdrawal \\");
    console.log(`    ${rawConfig.network === "mainnet" ? "--mainnet" : "--testnet"} \\`);
    console.log("    --governance-action-deposit \\");
    console.log(`      "$(cardano-cli conway query gov-state ${netFlag} \\`);
    console.log("        | jq '.currentPParams.govActionDeposit')\" \\");
    console.log(
      `    --deposit-return-stake-address ${depositReturnReward} \\`,
    );
    console.log(`    --anchor-url ${anchorUrl} \\`);
    console.log(`    --anchor-data-hash ${anchorHashHex} \\`);
    console.log(
      `    --funds-receiving-stake-address ${treasuryRewardAccount.toString()} \\`,
    );
    console.log(`    --transfer ${rawConfig.amountLovelace.toString()} \\`);
    console.log("    --out-file gov/action.draft");
    return;
  }

  // Submit via Blaze.
  const skHex = readFileSync("keys/admin.skey", "utf8").trim();
  const { blaze, network } = await loadProvider(skHex);
  if (network !== networkId) {
    throw new Error(
      `Network mismatch: provider gave ${network}, params says ${rawConfig.network}`,
    );
  }

  const deposit = await fetchGovActionDeposit();
  console.log(
    `gov_action_deposit (live from Blockfrost): ${deposit} lovelace ` +
      `(${(Number(deposit) / 1_000_000).toFixed(0)} tADA)`,
  );

  // Constitution's guardrails script hash. Conway requires every
  // treasury_withdrawals_action to reference this hash, so the CC-elected
  // guardrails script gets a chance to validate the proposal.
  //
  // Same value on preprod, preview, AND mainnet (genesis default guardrails
  // script — no chain has enacted a NewConstitution to replace it;
  // verified 2026-05-14 via book.world.dev.cardano.org/environments/
  // {preprod,preview,mainnet}/conway-genesis.json and via Koios
  // script_info — both return script_hash =
  // fa24fb305126805cf2164c161d852a0e7330cf988f1fe558cf7d4a64, type plutusV3).
  // Re-verify before any future submission with
  //   cardano-cli conway query constitution {--mainnet|--testnet-magic N}
  const guardrailsScriptHash = Hash28ByteBase16(
    "fa24fb305126805cf2164c161d852a0e7330cf988f1fe558cf7d4a64",
  );
  const governanceAction: Cardano.GovernanceAction = {
    __typename: Cardano.GovernanceActionType.treasury_withdrawals_action,
    withdrawals: new Set([
      {
        rewardAccount: treasuryRewardAccount.toString() as Cardano.RewardAccount,
        coin: rawConfig.amountLovelace,
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

  if (shouldUseManualEvaluator()) {
    console.log(
      "SKIP_EVAL=1 — using manual evaluator (Blockfrost preview eval is broken)",
    );
    tx.useEvaluator(manualEvaluator());
  }

  const built = await tx.complete();
  console.log(
    `Built gov-action submission tx. CBOR size: ${built.toCbor().toString().length / 2} bytes`,
  );
  console.log(`  Anchor URL : ${anchorUrl}`);
  console.log(`  Anchor hash: ${anchorHashHex}`);
  console.log(`  Withdraw to: ${treasuryRewardAccount.toString()}`);
  console.log(`  Amount     : ${rawConfig.amountLovelace} lovelace`);
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
