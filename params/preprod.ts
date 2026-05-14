import type {
  MultisigScript,
  TreasuryConfiguration,
  VendorConfiguration,
} from "@sundaeswap/treasury-funds";
import type { RawConfig, ResolvedConfig } from "./common";

/**
 * Preprod / preview concrete config (preview re-exports from this module).
 * Uses the real proposal totals and dates so testnet exercises the same
 * script parameters that mainnet will mint.
 *
 *   amount   : ₳8,503,000 (incl. 10% refundable contingency, per HackMD
 *              proposal as of 2026-05-14)
 *   T_max    : 2027-10-01 = end of 12-month delivery (July 2026 - June
 *              2027) + 3-month contingency window
 *   vendor.expiration: T_max + 30 days (= 2027-10-31)
 *   topology : operator (K_op) + 3-board (K_1..K_3) per Plan.md.
 *
 * Board pkhs: all three are the production board members' pubkey hashes
 * (same as in params/mainnet.ts) so testnet rehearsals exercise the real
 * multisig topology.
 *
 * Consequence: keys/board-{1,2,3}.skey no longer correspond to anything
 * in the on-chain script — local signing as any K_i is no longer possible
 * on testnet. Any future fund/disburse/sweep test on preprod/preview
 * will require hardware signatures from the actual board members.
 *
 * Also: the existing preview deployment (deployment/preview.json) was
 * minted with the OLD dev pkhs and has on-chain script hashes
 *   treasury: da192329...656b   vendor: 32e27ef4...28c2
 * which do NOT reproduce from this updated source. Subsequent scripts
 * (02-register, 03-build-gov-action) read those hashes from the
 * deployment file directly, so the live preview action continues to
 * work; only future fresh `init` runs use the new pkhs.
 *
 * Milestone schedule is NOT defined here. It is decided at fund-vendor
 * time (vendor datum, not script parameter), and the existing
 * 05-fund-vendor.ts will need a wired schedule before it can run.
 */
export const preprodRawConfig: RawConfig = {
  network: "preprod",
  adminAddress:
    "addr_test1qqhvk2xna6s7wglqx09k87l4my9uq74gaxrwqn3yqr2zzp97em0a23l90d0nw30feg6gahelyhk5cl5080uzxszrtcdspa5c55",
  boardPkhs: [
    "7095faf3d48d582fbae8b3f2e726670d7a35e2400c783d992bbdeffb", // K_1 — Matthias Benkort (Cardano Foundation), 2026-05-13
    "058a5ab0c66647dcce82d7244f80bfea41ba76c7c9ccaf86a41b00fe", // K_2 — Chris Gianelloni (Blink Labs), 2026-05-13
    "fe0921cfa53b2deef20f185258f8bc6e127ab6fa1084e62f0830ddef", // K_3 — Riley Kilgore (IOG), 2026-05-13
  ],
  amountLovelace: 8_503_000_000_000n,
  treasuryExpirationISO: "2027-10-01T00:00:00Z",
  vendorExpirationGraceDays: 30,
};

const sig = (pkh: string): MultisigScript => ({ Signature: { key_hash: pkh } });

const allOf = (scripts: MultisigScript[]): MultisigScript => ({
  AllOf: { scripts },
});

const atLeast = (
  required: bigint,
  scripts: MultisigScript[],
): MultisigScript => ({ AtLeast: { required, scripts } });

interface PermissionGroup {
  opSig: MultisigScript;
  boardSigs: MultisigScript[];
  /** AtLeast(1, board) — any single board member. */
  board1: MultisigScript;
  /** AtLeast(2, board) — board majority. */
  board2: MultisigScript;
  /** AllOf [K_op, AtLeast(1, board)] — operator + 1 board co-sign. */
  opPlus1: MultisigScript;
  /** AllOf [K_op, AtLeast(2, board)] — operator + board majority. */
  opPlus2: MultisigScript;
}

function permissionGroup(resolved: ResolvedConfig): PermissionGroup {
  const opSig = sig(resolved.adminPkhHex);
  const boardSigs = resolved.boardPkhs.map(sig);
  const board1 = atLeast(1n, boardSigs);
  const board2 = atLeast(2n, boardSigs);
  const opPlus1 = allOf([opSig, board1]);
  const opPlus2 = allOf([opSig, board2]);
  return { opSig, boardSigs, board1, board2, opPlus1, opPlus2 };
}

export function buildTreasuryConfig(
  resolved: ResolvedConfig,
  registryPolicyHex: string,
): TreasuryConfiguration {
  const { opSig, opPlus1, opPlus2 } = permissionGroup(resolved);
  return {
    registry_token: registryPolicyHex,
    permissions: {
      // K_op alone — no value leaves the script.
      reorganize: opSig,
      // Operator + 1-of-3 board (cheap, reversible: sweep just returns
      // funds to the Cardano treasury at expiry).
      sweep: opPlus1,
      // Operator + 2-of-3 board (board majority). Disburse moves funds
      // out of the treasury script to a recipient address; fund commits
      // funds to a vendor milestone schedule. Both are value-out
      // operations, so both require the same elevated threshold.
      disburse: opPlus2,
      fund: opPlus2,
    },
    expiration: resolved.treasuryExpirationMs,
    payout_upperbound: resolved.vendorPayoutUpperboundMs,
  };
}

export function buildVendorConfig(
  resolved: ResolvedConfig,
  registryPolicyHex: string,
): VendorConfiguration {
  const { board1, board2, opPlus2 } = permissionGroup(resolved);
  return {
    registry_token: registryPolicyHex,
    permissions: {
      // 1-of-3 board (cheap to flag).
      pause: board1,
      // 2-of-3 board (deliberate).
      resume: board2,
      // Operator + 2-of-3 board (restructures the milestone schedule).
      modify: opPlus2,
    },
    expiration: resolved.vendorExpirationMs,
  };
}

/**
 * The vendor multisig (in VendorDatum, set per Fund call) that gates
 * claim-on-maturation. For the preprod test this is K_op alone — Lantr
 * (vendor) signs to claim each matured milestone. Real per-project
 * deployments would set this at Fund time.
 */
export function vendorMultisig(resolved: ResolvedConfig): MultisigScript {
  return sig(resolved.adminPkhHex);
}
