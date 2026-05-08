import { existsSync, readFileSync } from "node:fs";
import sodium from "libsodium-wrappers-sumo";
import {
  Blaze,
  Blockfrost,
  Core,
  HotSingleWallet,
} from "@blaze-cardano/sdk";
import { Ed25519PrivateNormalKeyHex } from "@blaze-cardano/core";

export interface ProviderBundle {
  blaze: Blaze<Blockfrost, HotSingleWallet>;
  network: Core.NetworkId;
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.includes("REPLACE_ME")) {
    throw new Error(`Environment variable ${name} is not set. See .env.example.`);
  }
  return v;
}

/**
 * Build a Blaze instance for the configured network, with a HotSingleWallet
 * loaded from a hex-encoded Ed25519 private key.
 *
 * If `keys/admin.stake.skey` exists, the wallet is constructed as a base
 * address (payment + stake). Otherwise it falls back to an enterprise
 * address (payment only). The stake key path is intentionally hardcoded —
 * it pairs with `keys/admin.skey` via `gen-keys.ts`; everything else is a
 * mismatch we want to fail loudly.
 *
 * Awaits libsodium initialization internally so callers don't have to.
 */
const STAKE_SKEY_PATH = "keys/admin.stake.skey";

export async function loadProvider(
  adminSkeyHex: string,
): Promise<ProviderBundle> {
  await sodium.ready;

  const net = requireEnv("NETWORK");
  if (net !== "preprod" && net !== "mainnet") {
    throw new Error(`Unsupported NETWORK=${net}; expected "preprod" or "mainnet"`);
  }
  const projectId = requireEnv("BLOCKFROST_PROJECT_ID");
  const network =
    net === "mainnet" ? Core.NetworkId.Mainnet : Core.NetworkId.Testnet;
  const blockfrostNetwork = net === "mainnet" ? "cardano-mainnet" : "cardano-preprod";

  const provider = new Blockfrost({
    network: blockfrostNetwork,
    projectId,
  });

  const stakeSkeyHex = existsSync(STAKE_SKEY_PATH)
    ? readFileSync(STAKE_SKEY_PATH, "utf8").trim()
    : undefined;

  const wallet = new HotSingleWallet(
    Ed25519PrivateNormalKeyHex(adminSkeyHex),
    network,
    provider,
    stakeSkeyHex ? Ed25519PrivateNormalKeyHex(stakeSkeyHex) : undefined,
  );

  const blaze = await Blaze.from(provider, wallet);
  return { blaze, network };
}
