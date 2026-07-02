import { describe, expect, test } from "bun:test";
import { mainnetRawConfig } from "./mainnet";
import { resolveConfig } from "./common";
import { buildTreasuryConfig, buildVendorConfig } from "./preprod";

const FAKE_REGISTRY_POLICY =
  "cafebabecafebabecafebabecafebabecafebabecafebabecafebabe";

describe("mainnet raw config (Bifrost)", () => {
  const raw = mainnetRawConfig();

  test("network is mainnet", () => {
    expect(raw.network).toBe("mainnet");
  });

  test("adminAddress is the mainnet (addr1…) form of the K_op keypair", () => {
    expect(raw.adminAddress).toMatch(/^addr1[02-9ac-hj-np-z]+$/);
    expect(raw.adminAddress).toBe(
      "addr1qx0dmpgtyr6tyr7y555tkn707r9pnprs6gj2klthdvz99c7vcjy2fsjf8aenxn80lyr8czps6dh04jdsd40y8kcn9qrq0jjj2z",
    );
  });

  test("withdrawal amount matches the Phase 1 total incl. contingency (₳12,332,031)", () => {
    expect(raw.amountLovelace).toBe(12_332_031_000_000n);
  });

  test("T_max = 2027-07-31 (Q1 2027 delivery + 4-month buffer)", () => {
    expect(raw.treasuryExpirationISO).toBe("2027-07-31T00:00:00Z");
  });

  test("vendor grace is 30 days", () => {
    expect(raw.vendorExpirationGraceDays).toBe(30);
  });

  test("FluidTokens vendor pkh matches the testnet config", () => {
    expect(raw.fluidTokensPkh).toBe(
      "1c471b31ea0b04c652bd8f76b239aea5f57139bdc5a2b28ab1e69175",
    );
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

  test("resolved admin pkh matches the K_op keypair (same pkh as testnet)", () => {
    expect(resolved.adminPkhHex).toBe(
      "9edd850b20f4b20fc4a528bb4fcff0ca198470d224ab7d776b0452e3",
    );
  });

  test("treasury and vendor configurations build without errors", () => {
    expect(() => buildTreasuryConfig(resolved, FAKE_REGISTRY_POLICY)).not.toThrow();
    expect(() => buildVendorConfig(resolved, FAKE_REGISTRY_POLICY)).not.toThrow();
  });
});
