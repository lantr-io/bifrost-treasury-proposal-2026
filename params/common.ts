import { bech32 } from "bech32";

export type Network = "preprod" | "mainnet";

export interface RawConfig {
  network: Network;
  /** Bech32 Shelley address whose payment key hash is the single admin.
   *  Base address required for any flow that needs a deposit-return stake
   *  part (e.g. the gov-action submission). */
  adminAddress: string;
  /** Total amount to withdraw from the Cardano treasury, in lovelace.
   *  Held at the treasury script after enactment; vendor milestones are
   *  funded from this pool at fund-vendor time and any unallocated balance
   *  remains at the treasury script as contingency reserve. */
  amountLovelace: bigint;
  /** Absolute treasury expiration timestamp (ISO 8601, UTC). Baked into
   *  treasury and vendor script parameters at registry-mint time;
   *  immutable thereafter. After this point the treasury can be swept
   *  back to the Cardano treasury. */
  treasuryExpirationISO: string;
  /** vendor.expiration = treasury.expiration + this many days. Grace
   *  window for late Modify / sweep cleanup. Baked into vendor script
   *  parameters; immutable. */
  vendorExpirationGraceDays: number;
}

export interface ResolvedConfig {
  network: Network;
  adminAddress: string;
  adminPkhHex: string;
  amountLovelace: bigint;
  /** POSIX ms; matches RawConfig.treasuryExpirationISO. */
  treasuryExpirationMs: bigint;
  /** POSIX ms; = treasuryExpirationMs + vendorExpirationGraceDays days. */
  vendorExpirationMs: bigint;
  /** POSIX ms; hard cap on any milestone maturation the schedule may pick.
   *  Equal to treasuryExpirationMs by construction. */
  vendorPayoutUpperboundMs: bigint;
}

const MS_PER_DAY = 24n * 60n * 60n * 1000n;

/**
 * Extract the payment key hash (hex, 56 chars) from a Shelley address.
 * Parses bech32 directly per CIP-19 to avoid pulling libsodium into the
 * typecheck/test path.
 *
 * Shelley address header byte high nibble:
 *   0x0-0x3  base      (bit 4 distinguishes key vs script payment)
 *   0x4-0x5  pointer
 *   0x6-0x7  enterprise
 *   0x8      Byron (unsupported)
 *   0xE-0xF  reward (no payment part)
 *
 * Payment is a key hash iff the high nibble is 0, 2, 4, or 6 (bit 4 = 0).
 */
export function addressPaymentKeyHash(addr: string): string {
  let decoded: { prefix: string; words: number[] };
  try {
    decoded = bech32.decode(addr, 200);
  } catch (e) {
    throw new Error(`Could not bech32-decode address: ${addr}: ${String(e)}`);
  }
  const bytes = Buffer.from(bech32.fromWords(decoded.words));
  if (bytes.length < 29) {
    throw new Error(
      `Address ${addr} is too short (${bytes.length} bytes) to have a payment part`,
    );
  }
  const header = bytes[0]!;
  const highNibble = header >> 4;
  if (highNibble >= 0x8) {
    throw new Error(
      `Address ${addr} is not a Shelley payment address (header 0x${header.toString(16)})`,
    );
  }
  const paymentIsKeyHash = (highNibble & 0x1) === 0;
  if (!paymentIsKeyHash) {
    throw new Error(
      `Address ${addr} payment part is a script hash, not a key hash`,
    );
  }
  return bytes.subarray(1, 29).toString("hex");
}

/**
 * Resolve a RawConfig to its derived form. Pure function of static input —
 * every call returns identical bytes, so Utils.loadScripts produces the
 * same treasury+vendor script hashes at registry mint and at every
 * subsequent script invocation.
 */
export function resolveConfig(raw: RawConfig): ResolvedConfig {
  const adminAddress = raw.adminAddress;

  const parsed = Date.parse(raw.treasuryExpirationISO);
  if (Number.isNaN(parsed)) {
    throw new Error(
      `Could not parse treasuryExpirationISO: ${raw.treasuryExpirationISO}`,
    );
  }
  const treasuryMs = BigInt(parsed);
  const vendorMs =
    treasuryMs + BigInt(raw.vendorExpirationGraceDays) * MS_PER_DAY;

  return {
    network: raw.network,
    adminAddress,
    adminPkhHex: addressPaymentKeyHash(adminAddress),
    amountLovelace: raw.amountLovelace,
    treasuryExpirationMs: treasuryMs,
    vendorExpirationMs: vendorMs,
    vendorPayoutUpperboundMs: treasuryMs,
  };
}
