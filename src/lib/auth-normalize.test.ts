import { describe, expect, it } from "vitest";
import { normalizeMagicLinkIdentifier } from "./auth";

describe("normalizeMagicLinkIdentifier", () => {
  it("lowercases and accepts a normal address", () => {
    expect(normalizeMagicLinkIdentifier("Player@CazMasters.COM")).toBe(
      "player@cazmasters.com",
    );
  });

  it("rejects an address using the fullwidth @ (U+FF20)", () => {
    const fullwidthAt = "\uFF20";
    expect(() =>
      normalizeMagicLinkIdentifier(`attacker${fullwidthAt}evil.com@victim.com`),
    ).toThrow("Invalid email address format.");
  });

  it("rejects an address with two @", () => {
    expect(() =>
      normalizeMagicLinkIdentifier("user@evil.com@victim.com"),
    ).toThrow("Invalid email address format.");
  });
});