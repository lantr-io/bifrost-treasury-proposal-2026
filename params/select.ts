import type { RawConfig } from "./common";
import { preprodRawConfig } from "./preprod";
import { previewRawConfig } from "./preview";

/**
 * Pick the RawConfig for the current NETWORK env. Used by scripts that
 * submit txs (01/02/03) so the same code path works on preprod and preview
 * — the proposal content is identical across testnets, only the network
 * binding differs.
 *
 * Mainnet is intentionally NOT wired here: mainnet submission goes through
 * params/mainnet.ts once that file is populated and reviewed; mixing it
 * into this dispatcher would let a fat-fingered NETWORK env send the
 * mainnet tx by accident.
 */
export function selectRawConfig(): RawConfig {
  const net = process.env.NETWORK;
  if (net === "preprod") return preprodRawConfig;
  if (net === "preview") return previewRawConfig;
  throw new Error(
    `NETWORK must be "preprod" or "preview" (got "${net ?? "<unset>"}").` +
      ` For mainnet, plumb params/mainnet.ts in explicitly — not via this dispatcher.`,
  );
}
