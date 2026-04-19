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
 * Awaits libsodium initialization internally so callers don't have to.
 */
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

  const wallet = new HotSingleWallet(
    Ed25519PrivateNormalKeyHex(adminSkeyHex),
    network,
    provider,
  );

  const blaze = await Blaze.from(provider, wallet);
  return { blaze, network };
}
