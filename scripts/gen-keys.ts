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
 * Generate the admin keypair set for preprod:
 *
 *   keys/admin.{skey,vkey}        — payment key (Ed25519)
 *   keys/admin.stake.{skey,vkey}  — stake key (Ed25519)
 *   keys/admin.addr               — Shelley base address (addr_test1q…)
 *   keys/admin.stake.addr         — bech32 stake address (stake_test1…)
 *
 * Idempotent: if admin.skey already exists the script is a no-op.
 *
 * The result is a *base* address (payment + stake key hash). A stake part
 * is required for the gov-action deposit return; the same base address is
 * sufficient for ordinary tx signing, faucet pulls, and reward claims.
 */
async function main(): Promise<void> {
  await sodium.ready;

  const base = resolve("keys");
  const skPath = `${base}/admin.skey`;
  const vkPath = `${base}/admin.vkey`;
  const addrPath = `${base}/admin.addr`;
  const stakeSkPath = `${base}/admin.stake.skey`;
  const stakeVkPath = `${base}/admin.stake.vkey`;
  const stakeAddrPath = `${base}/admin.stake.addr`;

  if (existsSync(skPath)) {
    console.log(`${skPath} already exists — keeping existing keys`);
    return;
  }

  mkdirSync(base, { recursive: true });

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
  console.log(`Admin payment pkh : ${payPkhHex}`);
  console.log(`Admin stake   pkh : ${stakePkhHex}`);
  console.log(`Admin base addr   : ${baseAddress.toBech32()}`);
  console.log(`Admin stake addr  : ${stakeRewardAccount.toString()}`);
  console.log("");
  console.log("NOTE: Fund this address on preprod via the faucet:");
  console.log("  https://docs.cardano.org/cardano-testnets/tools/faucet");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
