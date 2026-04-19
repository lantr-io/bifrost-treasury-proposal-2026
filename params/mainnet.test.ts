import { describe, expect, test } from "bun:test";
import { mainnetRawConfig } from "./mainnet";

describe("mainnet placeholder", () => {
  test("throws when evaluated, with a TODO hint", () => {
    expect(() => mainnetRawConfig()).toThrow(/TODO/);
  });
});
