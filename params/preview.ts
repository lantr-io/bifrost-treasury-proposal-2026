import type { RawConfig } from "./common";

/**
 * Preview concrete config. Used to exercise the corrected (with-authors)
 * anchor on a second testnet before mainnet, since the original preprod
 * submission was made with a pre-authors anchor.
 *
 * The admin address, board pkhs, proposal totals, and dates are intentionally
 * identical to preprod — this is the same proposal, just submitted on a
 * different testnet. The bech32 `addr_test1q...` prefix is valid on every
 * testnet (networkId=0 in the header byte); only the node-protocol magic
 * differs (preview=2 vs preprod=1) and that's handled by the Blockfrost
 * network selector in scripts/lib/provider.ts, not by the address itself.
 */
export { buildTreasuryConfig, buildVendorConfig, vendorMultisig } from "./preprod";

import { preprodRawConfig } from "./preprod";

export const previewRawConfig: RawConfig = {
  ...preprodRawConfig,
  network: "preview",
};
