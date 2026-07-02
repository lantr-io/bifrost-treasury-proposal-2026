import type { RawConfig } from "./common";

/**
 * Preview concrete config — the near-term deployment target for publishing the
 * Bifrost treasury-withdrawal governance action (see design doc, Scope &
 * phasing).
 *
 * The admin address, board pkhs, FluidTokens vendor pkh, proposal totals, and
 * dates are intentionally identical to preprod — same proposal, different
 * testnet. The bech32 `addr_test1q...` prefix is valid on every testnet
 * (networkId=0 in the header byte); only the node-protocol magic differs
 * (preview=2 vs preprod=1), handled by the Blockfrost network selector in
 * scripts/lib/provider.ts, not by the address itself.
 */
export { buildTreasuryConfig, buildVendorConfig, vendorMultisig } from "./preprod";

import { preprodRawConfig } from "./preprod";

export const previewRawConfig: RawConfig = {
  ...preprodRawConfig,
  network: "preview",
};
