import { describe, expect, test } from "bun:test";
import { assertAnchorValid } from "./validate-anchor";

function minimalAnchor(title: string): unknown {
  return {
    hashAlgorithm: "blake2b-256",
    authors: [
      {
        name: "Test Author",
        witness: { witnessAlgorithm: "ed25519", publicKey: "ab", signature: "cd" },
      },
    ],
    body: {
      title,
      abstract: "abstract",
      motivation: "motivation",
      rationale: "rationale",
    },
  };
}

describe("assertAnchorValid", () => {
  test("accepts a title at exactly 80 characters", () => {
    const title = "a".repeat(80);
    expect(() => assertAnchorValid(minimalAnchor(title), "test anchor")).not.toThrow();
  });

  test("rejects a title over 80 characters (CIP-108 cap)", () => {
    const title = "a".repeat(84);
    expect(() => assertAnchorValid(minimalAnchor(title), "test anchor")).toThrow(
      /maxLength|more than 80/,
    );
  });
});
