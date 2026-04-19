import type {
  MultisigScript,
  TreasuryConfiguration,
  VendorConfiguration,
} from "@sundaeswap/treasury-funds";
import type { RawConfig, ResolvedConfig } from "./common";

/**
 * Preprod concrete config. 1,000,000 tADA, single milestone, single admin key
 * (derived from the proposer address) used for every permission.
 */
export const preprodRawConfig: RawConfig = {
  network: "preprod",
  adminAddress:
    "addr_test1qzwg0u9fpl8dac9rkramkcgzerjsfdlqgkw0q8hy5vwk8tzk5pgcmdpe5jeh92guy4mke4zdmagv228nucldzxv95clq68fray",
  amountLovelace: 1_000_000_000_000n,
  milestoneCount: 1,
  milestoneSpacingDays: 30,
  firstMilestoneOffsetDays: 30,
  expirationGraceDays: 180,
};

function adminSig(resolved: ResolvedConfig): MultisigScript {
  return { Signature: { key_hash: resolved.adminPkhHex } };
}

export function buildTreasuryConfig(
  resolved: ResolvedConfig,
  registryPolicyHex: string,
): TreasuryConfiguration {
  const sig = adminSig(resolved);
  return {
    registry_token: registryPolicyHex,
    permissions: {
      reorganize: sig,
      sweep: sig,
      fund: sig,
      disburse: sig,
    },
    expiration: resolved.treasuryExpirationMs,
    payout_upperbound: resolved.vendorPayoutUpperboundMs,
  };
}

export function buildVendorConfig(
  resolved: ResolvedConfig,
  registryPolicyHex: string,
): VendorConfiguration {
  const sig = adminSig(resolved);
  return {
    registry_token: registryPolicyHex,
    permissions: {
      pause: sig,
      resume: sig,
      modify: sig,
    },
    expiration: resolved.treasuryExpirationMs,
  };
}

/** The vendor multisig that gates claim-on-maturation. Same admin key. */
export function vendorMultisig(resolved: ResolvedConfig): MultisigScript {
  return adminSig(resolved);
}
