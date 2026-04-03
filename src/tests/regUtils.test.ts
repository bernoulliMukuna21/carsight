import { describe, it, expect } from "vitest";
import { normaliseReg, parseReg, processRegistrations } from "@/lib/regUtils";

describe("normaliseReg", () => {
  it("strips spaces and uppercases", () => {
    expect(normaliseReg("ab12 cde")).toBe("AB12CDE");
    expect(normaliseReg("  AB 12 CDE  ")).toBe("AB12CDE");
  });
});

describe("parseReg", () => {
  it("accepts valid new-style UK plates", () => {
    expect(parseReg("AB12 CDE")).toBe("AB12CDE");
    expect(parseReg("ab12cde")).toBe("AB12CDE");
  });

  it("accepts valid prefix-style plates", () => {
    expect(parseReg("A123 BCD")).toBe("A123BCD");
  });

  it("returns null for empty input", () => {
    expect(parseReg("")).toBeNull();
    expect(parseReg("  ")).toBeNull();
  });

  it("returns null for obviously invalid characters", () => {
    expect(parseReg("AB12!DE")).toBeNull();
  });
});

describe("processRegistrations", () => {
  it("deduplicates registrations", () => {
    const { valid } = processRegistrations(["AB12CDE", "ab12 cde", "AB12CDE"]);
    expect(valid).toEqual(["AB12CDE"]);
  });

  it("separates valid from invalid", () => {
    const { valid, invalid } = processRegistrations([
      "AB12CDE",
      "NOT!VALID",
      "CD34EFG",
    ]);
    expect(valid).toContain("AB12CDE");
    expect(valid).toContain("CD34EFG");
    expect(invalid).toContain("NOT!VALID");
  });

  it("ignores empty strings", () => {
    const { valid } = processRegistrations(["AB12CDE", "", "  "]);
    expect(valid).toEqual(["AB12CDE"]);
  });
});
