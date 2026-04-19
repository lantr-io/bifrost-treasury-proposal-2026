#!/usr/bin/env bun
import sodium from "libsodium-wrappers-sumo";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Ed25519PrivateKey } from "@blaze-cardano/core";
import { Core } from "@blaze-cardano/sdk";

/**
 * Generate keys/admin.{skey,vkey,addr} for preprod. Idempotent: if admin.skey
 * already exists the script is a no-op.
 *
 * The resulting address is an *enterprise* (payment-only, no staking)
 * address, which is sufficient to receive preprod faucet ADA and to act as
 * the single admin for this deployment.
 */
async function main(): Promise<void> {
  await sodium.ready;

  const base = resolve("keys");
  const skPath = `${base}/admin.skey`;
  const vkPath = `${base}/admin.vkey`;
  const addrPath = `${base}/admin.addr`;

  if (existsSync(skPath)) {
    console.log(`${skPath} already exists — keeping existing key`);
    return;
  }

  mkdirSync(base, { recursive: true });

  const seed = crypto.getRandomValues(new Uint8Array(32));
  const sk = Ed25519PrivateKey.fromNormalBytes(seed);
  const vk = await sk.toPublic();
  const pkhHex = (await vk.hash()).hex();

  const address = new Core.Address({
    type: Core.AddressType.EnterpriseKey,
    networkId: Core.NetworkId.Testnet,
    paymentPart: {
      type: Core.CredentialType.KeyHash,
      hash: pkhHex,
    },
  });

  writeFileSync(skPath, sk.hex() + "\n", { mode: 0o600 });
  writeFileSync(vkPath, vk.hex() + "\n");
  writeFileSync(addrPath, address.toBech32() + "\n");

  console.log(`Wrote ${skPath}, ${vkPath}, ${addrPath}`);
  console.log(`Admin pkh : ${pkhHex}`);
  console.log(`Admin addr: ${address.toBech32()}`);
  console.log("");
  console.log("NOTE: Fund this address on preprod via the faucet:");
  console.log("  https://docs.cardano.org/cardano-testnets/tools/faucet");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
