import { describe, it, expect } from "vitest";
import { classifyIssue } from "@/core/classification/classifier";

describe("classifyIssue", () => {
  it("classifies brake pipe corrosion as Brakes (not Structure/Corrosion)", () => {
    const result = classifyIssue({
      text: "brake pipe corroded",
      type: "MAJOR",
    });
    expect(result.family).toBe("Brakes");
  });

  it("classifies suspension arm bush as Suspension", () => {
    const result = classifyIssue({
      text: "offside front suspension arm bush deteriorated",
      type: "ADVISORY",
    });
    expect(result.family).toBe("Suspension");
  });

  it("classifies tyre tread below limit as Tyres/Wheels", () => {
    const result = classifyIssue({
      text: "nearside front tyre tread depth below legal limit",
      type: "DANGEROUS",
    });
    expect(result.family).toBe("Tyres/Wheels");
  });

  it("classifies engine management light as Engine management/MIL", () => {
    const result = classifyIssue({
      text: "engine management light illuminated",
      type: "MINOR",
    });
    expect(result.family).toBe("Engine management/MIL");
  });

  it("classifies fog lamp as Lighting/Electrics", () => {
    const result = classifyIssue({
      text: "offside front fog lamp not working",
      type: "MINOR",
    });
    expect(result.family).toBe("Lighting/Electrics");
  });

  it("classifies corrosion without brake context as Structure/Corrosion", () => {
    const result = classifyIssue({
      text: "offside sill corroded",
      type: "MAJOR",
    });
    expect(result.family).toBe("Structure/Corrosion");
  });

  it("falls back to Other for unrecognised text", () => {
    const result = classifyIssue({
      text: "something completely unrecognised xyzzy",
      type: "ADVISORY",
    });
    expect(result.family).toBe("Other");
  });
});
