import type { RawConfig } from "./common";

/**
 * Mainnet placeholder. NOT runnable as-is — replace every TODO with the real
 * value from the finalized Scalus Application Platform and Node Diversity
 * proposal before attempting to deploy to mainnet.
 *
 * Wrapped in a function so that merely importing this module does not crash
 * the process; calling it is the explicit acknowledgement that you intend to
 * use the mainnet path.
 */
export function mainnetRawConfig(): RawConfig {
  throw new Error(
    "TODO(mainnet): fill in mainnet params — see params/mainnet.ts for fields required",
  );

  // Shape to fill in when the real proposal is drafted:
  // return {
  //   network: "mainnet",
  //   adminAddress: "addr1q...",            // TODO(mainnet): real committee multisig signer address (or remove single-admin model entirely)
  //   amountLovelace: 0n,                   // TODO(mainnet): final withdrawal amount
  //   milestoneCount: 0,                    // TODO(mainnet): milestone count (1..24)
  //   milestoneSpacingDays: 0,              // TODO(mainnet)
  //   firstMilestoneOffsetDays: 0,          // TODO(mainnet)
  //   expirationGraceDays: 180,             // TODO(mainnet): review with legal/ops
  // };
}
