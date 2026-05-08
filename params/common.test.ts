import { describe, expect, test } from "bun:test";
import {
  addressPaymentKeyHash,
  resolveConfig,
  type RawConfig,
} from "./common";

describe("addressPaymentKeyHash", () => {
  test("extracts payment key hash from a Shelley base address", () => {
    const addr =
      "addr_test1qzwg0u9fpl8dac9rkramkcgzerjsfdlqgkw0q8hy5vwk8tzk5pgcmdpe5jeh92guy4mke4zdmagv228nucldzxv95clq68fray";
    const pkh = addressPaymentKeyHash(addr);
    expect(pkh).toMatch(/^[0-9a-f]{56}$/);
  });

  test("rejects a reward address (no payment part)", () => {
    const rewardAddr =
      "stake_test1uz46h2at4w46h2at4w46h2at4w46h2at4w46h2at4w46h2cwudutw";
    expect(() => addressPaymentKeyHash(rewardAddr)).toThrow(
      /not a Shelley payment/,
    );
  });
});

describe("resolveConfig", () => {
  const baseRaw: RawConfig = {
    network: "preprod",
    adminAddress:
      "addr_test1qzwg0u9fpl8dac9rkramkcgzerjsfdlqgkw0q8hy5vwk8tzk5pgcmdpe5jeh92guy4mke4zdmagv228nucldzxv95clq68fray",
    amountLovelace: 8_503_000_000_000n,
    treasuryExpirationISO: "2027-09-01T00:00:00Z",
    vendorExpirationGraceDays: 30,
  };

  test("treasuryExpirationMs matches the supplied ISO timestamp", () => {
    const resolved = resolveConfig(baseRaw);
    expect(resolved.treasuryExpirationMs).toBe(
      BigInt(Date.parse("2027-09-01T00:00:00Z")),
    );
    expect(resolved.vendorPayoutUpperboundMs).toBe(
      resolved.treasuryExpirationMs,
    );
  });

  test("vendorExpirationMs = treasuryExpiration + grace days", () => {
    const resolved = resolveConfig(baseRaw);
    const oneDayMs = 24n * 60n * 60n * 1000n;
    expect(resolved.vendorExpirationMs).toBe(
      resolved.treasuryExpirationMs + 30n * oneDayMs,
    );
  });

  test("is a pure function — repeated calls produce identical output", () => {
    const a = resolveConfig(baseRaw);
    const b = resolveConfig(baseRaw);
    expect(a).toEqual(b);
  });

  test("rejects unparseable ISO timestamps", () => {
    expect(() =>
      resolveConfig({ ...baseRaw, treasuryExpirationISO: "not-a-date" }),
    ).toThrow(/treasuryExpirationISO/);
  });
});
