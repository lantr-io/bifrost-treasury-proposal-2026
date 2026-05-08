#!/usr/bin/env bun
import sodium from "libsodium-wrappers-sumo";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  Ed25519PrivateKey,
  Hash28ByteBase16,
  RewardAccount,
} from "@blaze-cardano/core";
import { Core } from "@blaze-cardano/sdk";

/**
 * Generate the operator + oversight-board keypairs for preprod.
 *
 *   keys/admin.{skey,vkey}        — operator (K_op) payment key (Ed25519)
 *   keys/admin.stake.{skey,vkey}  — operator stake key (Ed25519)
 *   keys/admin.addr               — Shelley base address (addr_test1q…)
 *   keys/admin.stake.addr         — bech32 stake address (stake_test1…)
 *   keys/board-{1,2,3}.{skey,vkey,pkh}
 *                                 — oversight board members K_1..K_3.
 *                                   Payment-only (no addresses): they sign
 *                                   the multisig validators in
 *                                   params/preprod.ts; they don't hold ADA
 *                                   directly.
 *
 * Idempotent per file: each output is generated only if absent. The
 * operator base address is required for the gov-action deposit return;
 * board pkhs land in params/preprod.ts.
 */
async function generateAdmin(base: string): Promise<void> {
  const skPath = `${base}/admin.skey`;
  const vkPath = `${base}/admin.vkey`;
  const addrPath = `${base}/admin.addr`;
  const stakeSkPath = `${base}/admin.stake.skey`;
  const stakeVkPath = `${base}/admin.stake.vkey`;
  const stakeAddrPath = `${base}/admin.stake.addr`;

  if (existsSync(skPath)) {
    console.log(`${skPath} exists — keeping existing operator keys`);
    return;
  }

  const paySeed = crypto.getRandomValues(new Uint8Array(32));
  const paySk = Ed25519PrivateKey.fromNormalBytes(paySeed);
  const payVk = await paySk.toPublic();
  const payPkhHex = (await payVk.hash()).hex();

  const stakeSeed = crypto.getRandomValues(new Uint8Array(32));
  const stakeSk = Ed25519PrivateKey.fromNormalBytes(stakeSeed);
  const stakeVk = await stakeSk.toPublic();
  const stakePkhHex = (await stakeVk.hash()).hex();

  const networkId = Core.NetworkId.Testnet;

  const baseAddress = new Core.Address({
    type: Core.AddressType.BasePaymentKeyStakeKey,
    networkId,
    paymentPart: {
      type: Core.CredentialType.KeyHash,
      hash: Hash28ByteBase16(payPkhHex),
    },
    delegationPart: {
      type: Core.CredentialType.KeyHash,
      hash: Hash28ByteBase16(stakePkhHex),
    },
  });

  const stakeRewardAccount = RewardAccount.fromCredential(
    {
      type: Core.CredentialType.KeyHash,
      hash: Hash28ByteBase16(stakePkhHex),
    },
    networkId,
  );

  writeFileSync(skPath, paySk.hex() + "\n", { mode: 0o600 });
  writeFileSync(vkPath, payVk.hex() + "\n");
  writeFileSync(addrPath, baseAddress.toBech32() + "\n");
  writeFileSync(stakeSkPath, stakeSk.hex() + "\n", { mode: 0o600 });
  writeFileSync(stakeVkPath, stakeVk.hex() + "\n");
  writeFileSync(stakeAddrPath, stakeRewardAccount.toString() + "\n");

  console.log(`Wrote ${skPath}, ${vkPath}, ${addrPath}`);
  console.log(`Wrote ${stakeSkPath}, ${stakeVkPath}, ${stakeAddrPath}`);
  console.log(`Operator payment pkh : ${payPkhHex}`);
  console.log(`Operator stake   pkh : ${stakePkhHex}`);
  console.log(`Operator base addr   : ${baseAddress.toBech32()}`);
  console.log(`Operator stake addr  : ${stakeRewardAccount.toString()}`);
}

async function generateBoardMember(base: string, n: number): Promise<void> {
  const skPath = `${base}/board-${n}.skey`;
  const vkPath = `${base}/board-${n}.vkey`;
  const pkhPath = `${base}/board-${n}.pkh`;

  if (existsSync(skPath)) {
    console.log(`${skPath} exists — keeping existing board-${n} key`);
    return;
  }

  const seed = crypto.getRandomValues(new Uint8Array(32));
  const sk = Ed25519PrivateKey.fromNormalBytes(seed);
  const vk = await sk.toPublic();
  const pkhHex = (await vk.hash()).hex();

  writeFileSync(skPath, sk.hex() + "\n", { mode: 0o600 });
  writeFileSync(vkPath, vk.hex() + "\n");
  writeFileSync(pkhPath, pkhHex + "\n");

  console.log(`Wrote ${skPath}, ${vkPath}, ${pkhPath}`);
  console.log(`Board K_${n} pkh : ${pkhHex}`);
}

async function main(): Promise<void> {
  await sodium.ready;

  const base = resolve("keys");
  mkdirSync(base, { recursive: true });

  await generateAdmin(base);
  for (const n of [1, 2, 3]) {
    await generateBoardMember(base, n);
  }

  console.log("");
  console.log("NOTE: Fund the operator base address on preprod via the faucet:");
  console.log("  https://docs.cardano.org/cardano-testnets/tools/faucet");
  console.log("");
  console.log("Update params/preprod.ts:boardPkhs from keys/board-{1,2,3}.pkh");
  console.log("(or run gen-keys after editing params if you trust the file order).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
