import { bech32 } from "bech32";

export type Network = "preprod" | "mainnet";

export interface RawConfig {
  network: Network;
  /** Bech32 Shelley base address whose payment key hash is the single admin. */
  adminAddress: string;
  /** Total amount to withdraw from the Cardano treasury, in lovelace. */
  amountLovelace: bigint;
  /** How many vendor milestones to split the amount into. >= 1, <= 24. */
  milestoneCount: number;
  /** Days of spacing between consecutive milestones. */
  milestoneSpacingDays: number;
  /** Days after "now" when the first milestone matures. */
  firstMilestoneOffsetDays: number;
  /** Grace window between the last milestone and treasury expiration. */
  expirationGraceDays: number;
}

export interface MilestoneEntry {
  maturation: Date;
  amountLovelace: bigint;
}

export interface ResolvedConfig {
  network: Network;
  adminAddress: string;
  adminPkhHex: string;
  amountLovelace: bigint;
  schedule: MilestoneEntry[];
  /** POSIX ms after which funds can be swept back to the Cardano treasury. */
  treasuryExpirationMs: bigint;
  /** POSIX ms: hard cap on any milestone maturation the committee may pick. */
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
 * Build an even milestone schedule from the raw config. The last milestone
 * absorbs any rounding remainder so total payouts exactly equal amountLovelace.
 */
export function resolveSchedule(
  raw: RawConfig,
  now: Date = new Date(),
): MilestoneEntry[] {
  if (raw.milestoneCount < 1 || raw.milestoneCount > 24) {
    throw new Error(
      `milestoneCount must be between 1 and 24 (got ${raw.milestoneCount})`,
    );
  }
  const per = raw.amountLovelace / BigInt(raw.milestoneCount);
  const remainder =
    raw.amountLovelace - per * BigInt(raw.milestoneCount);
  const baseMs =
    BigInt(now.getTime()) + BigInt(raw.firstMilestoneOffsetDays) * MS_PER_DAY;
  const entries: MilestoneEntry[] = [];
  for (let i = 0; i < raw.milestoneCount; i++) {
    const matMs =
      baseMs + BigInt(i) * BigInt(raw.milestoneSpacingDays) * MS_PER_DAY;
    const amount = i === raw.milestoneCount - 1 ? per + remainder : per;
    entries.push({
      maturation: new Date(Number(matMs)),
      amountLovelace: amount,
    });
  }
  return entries;
}

export function resolveConfig(
  raw: RawConfig,
  now: Date = new Date(),
): ResolvedConfig {
  const schedule = resolveSchedule(raw, now);
  const lastMs = BigInt(schedule[schedule.length - 1]!.maturation.getTime());
  const treasuryExpirationMs =
    lastMs + BigInt(raw.expirationGraceDays) * MS_PER_DAY;
  return {
    network: raw.network,
    adminAddress: raw.adminAddress,
    adminPkhHex: addressPaymentKeyHash(raw.adminAddress),
    amountLovelace: raw.amountLovelace,
    schedule,
    treasuryExpirationMs,
    vendorPayoutUpperboundMs: treasuryExpirationMs,
  };
}
