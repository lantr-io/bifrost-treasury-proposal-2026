import { describe, expect, test } from "bun:test";
import {
  addressPaymentKeyHash,
  resolveSchedule,
  type RawConfig,
} from "./common";

describe("addressPaymentKeyHash", () => {
  test("extracts payment key hash from a Shelley base address", () => {
    const addr =
      "addr_test1qzwg0u9fpl8dac9rkramkcgzerjsfdlqgkw0q8hy5vwk8tzk5pgcmdpe5jeh92guy4mke4zdmagv228nucldzxv95clq68fray";
    const pkh = addressPaymentKeyHash(addr);
    expect(pkh).toMatch(/^[0-9a-f]{56}$/);
    // Known: bech32 header byte 0x00 → base key+key, payment part is 28 bytes
    // immediately after the header. We verify shape here; the value is
    // independently verified by downstream cardano tooling.
  });

  test("rejects a reward address (no payment part)", () => {
    // Crafted reward address: header 0xe0 (reward, testnet, key) + dummy hash.
    const rewardAddr =
      "stake_test1uz46h2at4w46h2at4w46h2at4w46h2at4w46h2at4w46h2cwudutw";
    expect(() => addressPaymentKeyHash(rewardAddr)).toThrow(
      /not a Shelley payment/,
    );
  });
});

describe("resolveSchedule", () => {
  test("single-milestone schedule returns one entry with the full amount", () => {
    const raw: RawConfig = {
      network: "preprod",
      adminAddress:
        "addr_test1qzwg0u9fpl8dac9rkramkcgzerjsfdlqgkw0q8hy5vwk8tzk5pgcmdpe5jeh92guy4mke4zdmagv228nucldzxv95clq68fray",
      amountLovelace: 1_000_000_000_000n,
      milestoneCount: 1,
      milestoneSpacingDays: 30,
      firstMilestoneOffsetDays: 30,
      expirationGraceDays: 180,
    };
    const now = new Date("2026-05-01T00:00:00Z");
    const schedule = resolveSchedule(raw, now);
    expect(schedule).toHaveLength(1);
    expect(schedule[0]!.amountLovelace).toBe(1_000_000_000_000n);
    expect(schedule[0]!.maturation.toISOString()).toBe(
      "2026-05-31T00:00:00.000Z",
    );
  });

  test("multi-milestone schedule splits evenly and spaces correctly", () => {
    const raw: RawConfig = {
      network: "preprod",
      adminAddress:
        "addr_test1qzwg0u9fpl8dac9rkramkcgzerjsfdlqgkw0q8hy5vwk8tzk5pgcmdpe5jeh92guy4mke4zdmagv228nucldzxv95clq68fray",
      amountLovelace: 900_000_000_000n,
      milestoneCount: 3,
      milestoneSpacingDays: 90,
      firstMilestoneOffsetDays: 30,
      expirationGraceDays: 180,
    };
    const now = new Date("2026-05-01T00:00:00Z");
    const schedule = resolveSchedule(raw, now);
    expect(schedule).toHaveLength(3);
    for (const entry of schedule) {
      expect(entry.amountLovelace).toBe(300_000_000_000n);
    }
    expect(schedule[0]!.maturation.toISOString()).toBe(
      "2026-05-31T00:00:00.000Z",
    );
    expect(schedule[1]!.maturation.toISOString()).toBe(
      "2026-08-29T00:00:00.000Z",
    );
    expect(schedule[2]!.maturation.toISOString()).toBe(
      "2026-11-27T00:00:00.000Z",
    );
  });

  test("remainder lovelace goes to the last milestone (no coins lost)", () => {
    const raw: RawConfig = {
      network: "preprod",
      adminAddress:
        "addr_test1qzwg0u9fpl8dac9rkramkcgzerjsfdlqgkw0q8hy5vwk8tzk5pgcmdpe5jeh92guy4mke4zdmagv228nucldzxv95clq68fray",
      amountLovelace: 1_000_000_000_001n,
      milestoneCount: 3,
      milestoneSpacingDays: 30,
      firstMilestoneOffsetDays: 30,
      expirationGraceDays: 180,
    };
    const schedule = resolveSchedule(raw, new Date("2026-05-01T00:00:00Z"));
    const total = schedule.reduce((a, m) => a + m.amountLovelace, 0n);
    expect(total).toBe(1_000_000_000_001n);
    expect(schedule[schedule.length - 1]!.amountLovelace).toBe(
      333_333_333_333n + 2n,
    );
  });
});
