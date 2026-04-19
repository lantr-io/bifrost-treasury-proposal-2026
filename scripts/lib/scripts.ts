import {
  Utils,
  type TreasuryConfiguration,
  type VendorConfiguration,
} from "@sundaeswap/treasury-funds";
import { type Address } from "@blaze-cardano/core";
import { Core } from "@blaze-cardano/sdk";

export interface CompiledScriptView {
  scriptHashHex: string;
  address: Address;
}

export interface CompiledScripts {
  treasury: CompiledScriptView;
  vendor: CompiledScriptView;
}

/**
 * Compile treasury and vendor scripts under the given network and configs.
 * Returns only the minimal derived data we need downstream (hash + address).
 *
 * Callers that need the full ICompiledScript (e.g. to access script refs)
 * should call Utils.loadScripts directly — this helper is a stable
 * summary-only view suitable for persistence and comparison.
 */
export function compileScripts(
  network: Core.NetworkId,
  treasuryConfig: TreasuryConfiguration,
  vendorConfig: VendorConfiguration,
): CompiledScripts {
  const scripts = Utils.loadScripts(network, treasuryConfig, vendorConfig);
  return {
    treasury: {
      scriptHashHex: scripts.treasuryScript.script.Script.hash(),
      address: scripts.treasuryScript.scriptAddress,
    },
    vendor: {
      scriptHashHex: scripts.vendorScript.script.Script.hash(),
      address: scripts.vendorScript.scriptAddress,
    },
  };
}
