import { describe, expect, test } from "bun:test";
import { mainnetRawConfig } from "./mainnet";
import { resolveConfig } from "./common";
import { buildTreasuryConfig, buildVendorConfig } from "./preprod";

const FAKE_REGISTRY_POLICY =
  "cafebabecafebabecafebabecafebabecafebabecafebabecafebabe";

describe("mainnet raw config", () => {
  const raw = mainnetRawConfig();

  test("network is mainnet", () => {
    expect(raw.network).toBe("mainnet");
  });

  test("adminAddress is mainnet bech32 (addr1…) with payment-pkh matching the testnet admin keypair", () => {
    expect(raw.adminAddress).toMatch(/^addr1[02-9ac-hj-np-z]+$/);
    expect(raw.adminAddress).toBe(
      "addr1qyhvk2xna6s7wglqx09k87l4my9uq74gaxrwqn3yqr2zzp97em0a23l90d0nw30feg6gahelyhk5cl5080uzxszrtcdsztfcct",
    );
  });

  test("withdrawal amount matches the proposal total (₳2,464,844)", () => {
    expect(raw.amountLovelace).toBe(2_464_844_000_000n);
  });

  test("T_max = 2027-07-01 (9-month delivery July 2026 - Q1 2027, lean buffer, no contingency)", () => {
    expect(raw.treasuryExpirationISO).toBe("2027-07-01T00:00:00Z");
  });

  test("vendor grace is 30 days", () => {
    expect(raw.vendorExpirationGraceDays).toBe(30);
  });

  test("board pkhs match the preview/preprod production set (same humans on mainnet)", () => {
    expect(raw.boardPkhs).toEqual([
      "7095faf3d48d582fbae8b3f2e726670d7a35e2400c783d992bbdeffb",
      "058a5ab0c66647dcce82d7244f80bfea41ba76c7c9ccaf86a41b00fe",
      "fe0921cfa53b2deef20f185258f8bc6e127ab6fa1084e62f0830ddef",
    ]);
  });
});

describe("mainnet resolveConfig + permissions", () => {
  const resolved = resolveConfig(mainnetRawConfig());

  test("resolved admin pkh matches preview admin pkh (same keypair)", () => {
    expect(resolved.adminPkhHex).toBe(
      "2ecb28d3eea1e723e033cb63fbf5d90bc07aa8e986e04e2400d42104",
    );
  });

  test("treasury and vendor configurations build without errors", () => {
    expect(() => buildTreasuryConfig(resolved, FAKE_REGISTRY_POLICY)).not.toThrow();
    expect(() => buildVendorConfig(resolved, FAKE_REGISTRY_POLICY)).not.toThrow();
  });
});
