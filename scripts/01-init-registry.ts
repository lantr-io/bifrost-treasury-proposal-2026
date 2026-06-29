#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import sodium from "libsodium-wrappers-sumo";
import {
  OneshotOneshotMint,
  type ScriptHashRegistry,
  Utils,
  ScriptHashRegistry as ScriptHashRegistrySchema,
} from "@sundaeswap/treasury-funds";
import { serialize, Void } from "@blaze-cardano/data";
import {
  AssetName,
  AuxiliaryData,
  Datum,
  Ed25519KeyHashHex,
  PolicyId,
  TransactionOutput,
  toHex,
} from "@blaze-cardano/core";
import { Core } from "@blaze-cardano/sdk";
import { loadProvider } from "./lib/provider";
import {
  loadDeployment,
  saveDeployment,
  type DeploymentState,
} from "./lib/deployment";
import { buildTreasuryConfig, buildVendorConfig } from "../params/preprod";
import { resolveConfig } from "../params/common";
import { selectRawConfig } from "../params/select";
import { mainnetRawConfig } from "../params/mainnet";
import {
  manualEvaluator,
  shouldUseManualEvaluator,
} from "./lib/manual-evaluator";

// Mainnet is intentionally out of params/select.ts to keep a fat-fingered
// NETWORK=mainnet from accidentally producing a testnet-style import. We
// dispatch here so the mainnet path is visible in this file.
const rawConfig =
  process.env.NETWORK === "mainnet" ? mainnetRawConfig() : selectRawConfig();
const DEPLOYMENT_PATH = `deployment/${rawConfig.network}.json`;
const DRY_RUN = !process.argv.includes("--submit");

async function main(): Promise<void> {
  await sodium.ready;

  if (loadDeployment(DEPLOYMENT_PATH)) {
    console.log(`${DEPLOYMENT_PATH} already exists. Init already ran. Skipping.`);
    return;
  }

  const skHex = readFileSync("keys/admin.skey", "utf8").trim();
  const { blaze, network } = await loadProvider(skHex);
  const expectedNetwork =
    rawConfig.network === "mainnet"
      ? Core.NetworkId.Mainnet
      : Core.NetworkId.Testnet;
  if (network !== expectedNetwork) {
    throw new Error(
      `Network mismatch: provider gave ${network}, params says ${rawConfig.network} (${expectedNetwork})`,
    );
  }

  // Pick the one-shot seed UTxO. Default: the first wallet UTxO. An explicit
  // `--seed <txid#ix>` overrides this so a parity run can force both the bun
  // and the scalus pipeline onto the identical seed — without it each picks a
  // different UTxO, the oneshot policy diverges, and every downstream hash
  // (treasury/vendor) differs.
  const walletUtxos = await blaze.wallet.getUnspentOutputs();
  if (walletUtxos.length === 0) {
    const addrs = await blaze.wallet.getUsedAddresses();
    throw new Error(
      `Admin wallet has no UTxOs. Fund ${addrs[0]?.toBech32()} on ${rawConfig.network} faucet first.`,
    );
  }
  const seedFlagIdx = process.argv.indexOf("--seed");
  const seedRef = seedFlagIdx >= 0 ? process.argv[seedFlagIdx + 1] : undefined;
  let seed = walletUtxos[0]!;
  if (seedRef) {
    const [wantTx, wantIxStr] = seedRef.split("#");
    const wantIx = BigInt(wantIxStr ?? "");
    const match = walletUtxos.find(
      (u) =>
        u.input().transactionId().toString() === wantTx &&
        u.input().index() === wantIx,
    );
    if (!match) {
      throw new Error(
        `--seed ${seedRef} not found among admin wallet UTxOs`,
      );
    }
    seed = match;
  }
  const seedInput = seed.input();
  const seedUtxoData = {
    transaction_id: seedInput.transactionId(),
    output_index: seedInput.index(),
  };

  // Compile the oneshot minting policy parameterized by the seed UTxO.
  // trace=true selects the stripped (production) bytecode in the
  // patched @sundaeswap/treasury-funds package — keeps the registry
  // policy hash consistent with how subsequent scripts compile their
  // validators. See scripts/patch-sundae.ts.
  const oneshotScript = new OneshotOneshotMint(seedUtxoData, true);
  const registryPolicyHex = oneshotScript.Script.hash();
  const registryAssetNameHex = toHex(Buffer.from("REGISTRY"));

  const resolved = resolveConfig(rawConfig);
  const treasuryCfg = buildTreasuryConfig(resolved, registryPolicyHex);
  const vendorCfg = buildVendorConfig(resolved, registryPolicyHex);
  const compiled = Utils.loadScripts(network, treasuryCfg, vendorCfg, true);

  const treasuryHash = compiled.treasuryScript.script.Script.hash();
  const vendorHash = compiled.vendorScript.script.Script.hash();
  const walletAddrs = await blaze.wallet.getUsedAddresses();

  console.log(`Admin addr        : ${walletAddrs[0]?.toBech32()}`);
  console.log(
    `Seed UTxO         : ${seedInput.transactionId()}#${seedInput.index()}`,
  );
  console.log(`Registry policy   : ${registryPolicyHex}`);
  console.log(`Treasury script   : ${treasuryHash}`);
  console.log(`Vendor   script   : ${vendorHash}`);

  // The registry NFT lives at the oneshot policy's enterprise-script address
  // (always-fails spend → locked forever). The datum carries both script
  // hashes so treasury and vendor can resolve each other at runtime.
  const registryAddress = new Core.Address({
    type: Core.AddressType.EnterpriseScript,
    networkId: network,
    paymentPart: { type: Core.CredentialType.ScriptHash, hash: registryPolicyHex },
  });
  const registryDatum: ScriptHashRegistry = {
    treasury: { Script: [treasuryHash] },
    vendor: { Script: [vendorHash] },
  };
  const registryOutput = new TransactionOutput(
    registryAddress,
    Utils.contractsValueToCoreValue({
      [registryPolicyHex]: { [registryAssetNameHex]: 1n },
    }),
  );
  registryOutput.setDatum(
    Datum.fromCore(
      serialize(ScriptHashRegistrySchema, registryDatum).toCore(),
    ),
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

  if (shouldUseManualEvaluator()) {
    console.log(
      "SKIP_EVAL=1 — using manual evaluator (Blockfrost preview eval is broken)",
    );
    txBuilder.useEvaluator(manualEvaluator());
  }

  const built = await txBuilder.complete();

  console.log(
    `\nBuilt registry-init tx. CBOR size: ${built.toCbor().toString().length / 2} bytes.`,
  );

  if (DRY_RUN) {
    console.log(
      "\n--dry-run (default): not submitting. Re-run with --submit to broadcast.",
    );
    return;
  }

  const signed = await blaze.signTransaction(built);
  const txHash = await blaze.submitTransaction(signed);
  console.log(`Submitted. Tx hash: ${txHash}`);

  const state: DeploymentState = {
    network: rawConfig.network,
    seedUtxo: {
      txId: seedInput.transactionId().toString(),
      outputIndex: Number(seedInput.index()),
    },
    registryPolicyHex,
    registryAssetNameHex,
    treasuryScriptHashHex: treasuryHash,
    vendorScriptHashHex: vendorHash,
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
