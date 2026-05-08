import { readFileSync } from "node:fs";
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

  // BLOCKFROST_URL override lets us point at a local Yaci DevKit's
  // Blockfrost-compatible store (http://localhost:8080/api/v1/) without
  // changing call sites. Yaci ignores the project_id header.
  const urlOverride = process.env.BLOCKFROST_URL;
  if (urlOverride) {
    provider.url = urlOverride.endsWith("/") ? urlOverride : urlOverride + "/";

    // Yaci Store's /epochs/latest/parameters omits cost_models_raw (the
    // ordered-array form Blaze expects), only providing cost_models with
    // named keys. YACI_GENESIS_DIR points at the devnet's genesis files,
    // which carry the raw arrays — patch fetch to inject them.
    const genesisDir = process.env.YACI_GENESIS_DIR;
    if (genesisDir) {
      patchFetchForYaciCostModels(provider.url, genesisDir);
    }
  }

  const wallet = new HotSingleWallet(
    Ed25519PrivateNormalKeyHex(adminSkeyHex),
    network,
    provider,
  );

  const blaze = await Blaze.from(provider, wallet);
  return { blaze, network };
}

let costModelPatchInstalled = false;

function patchFetchForYaciCostModels(
  providerUrl: string,
  genesisDir: string,
): void {
  if (costModelPatchInstalled) return;
  costModelPatchInstalled = true;

  const alonzo = JSON.parse(
    readFileSync(`${genesisDir}/alonzo-genesis.json`, "utf8"),
  ) as { costModels: { PlutusV1: number[]; PlutusV2: number[] } };
  const conway = JSON.parse(
    readFileSync(`${genesisDir}/conway-genesis.json`, "utf8"),
  ) as { plutusV3CostModel: number[] };
  const costModelsRaw = {
    PlutusV1: alonzo.costModels.PlutusV1,
    PlutusV2: alonzo.costModels.PlutusV2,
    PlutusV3: conway.plutusV3CostModel,
  };

  const paramsUrl = providerUrl + "epochs/latest/parameters";
  const evalUrl = providerUrl + "utils/txs/evaluate/utxos";
  const origFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    let urlStr =
      typeof input === "string" ? input : (input as URL | Request).toString();
    // Yaci is strict about `//` in paths; Blaze's URL templates produce
    // them when query strings start with `/`. Collapse path slashes for any
    // request to our provider (other origins are untouched).
    if (urlStr.startsWith(providerUrl.replace(/\/+$/, ""))) {
      urlStr = urlStr.replace(/([^:])\/{2,}/g, "$1/");
    }
    const resp = await origFetch(urlStr, init);
    if (urlStr === paramsUrl && resp.ok) {
      const body = await resp.clone().json();
      if (!body.cost_models_raw) {
        body.cost_models_raw = costModelsRaw;
        return new Response(JSON.stringify(body), {
          status: resp.status,
          headers: resp.headers,
        });
      }
    }
    if (urlStr === evalUrl && resp.ok) {
      // Yaci's Ogmios uses Conway's "publish" purpose for cert+vote redeemers;
      // Blaze still expects "certificate". Rewrite pointers so Blaze's
      // purposeToTag lookup succeeds.
      const body = await resp.clone().json();
      if (body?.result?.EvaluationResult) {
        const r = body.result.EvaluationResult;
        const fixed: Record<string, unknown> = {};
        for (const k of Object.keys(r)) {
          fixed[k.replace(/^publish:/, "certificate:")] = r[k];
        }
        body.result.EvaluationResult = fixed;
        return new Response(JSON.stringify(body), {
          status: resp.status,
          headers: resp.headers,
        });
      }
    }
    return resp;
  };
}
