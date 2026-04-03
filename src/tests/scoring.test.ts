import { describe, it, expect } from "vitest";
import { scoreVehicle } from "@/core/scoring";
import {
  cleanCarTests,
  dangerousDefectTests,
  repeatAdvisoryTests,
  mileageAnomalyTests,
} from "@/fixtures/vehicles";

describe("scoreVehicle", () => {
  it("scores a clean car in the Low band", () => {
    const { breakdown } = scoreVehicle(cleanCarTests);
    expect(breakdown.total).toBeLessThanOrEqual(14);
    expect(breakdown.band).toBe("Low");
  });

  it("scores a car with a recent dangerous defect in High or Very High band", () => {
    const { breakdown } = scoreVehicle(dangerousDefectTests);
    expect(breakdown.total).toBeGreaterThan(49);
    expect(["High", "Very High"]).toContain(breakdown.band);
  });

  it("scores a repeat advisory car higher than a clean car", () => {
    const clean = scoreVehicle(cleanCarTests);
    const repeat = scoreVehicle(repeatAdvisoryTests);
    expect(repeat.breakdown.total).toBeGreaterThan(clean.breakdown.total);
  });

  it("never exceeds score caps per component", () => {
    const { breakdown } = scoreVehicle(dangerousDefectTests);
    expect(breakdown.severity).toBeLessThanOrEqual(35);
    expect(breakdown.repetition).toBeLessThanOrEqual(20);
    expect(breakdown.safety).toBeLessThanOrEqual(20);
    expect(breakdown.maintenance).toBeLessThanOrEqual(15);
    expect(breakdown.mileage).toBeLessThanOrEqual(10);
    expect(breakdown.total).toBeLessThanOrEqual(100);
  });

  it("is deterministic — same input always produces same output", () => {
    const a = scoreVehicle(repeatAdvisoryTests);
    const b = scoreVehicle(repeatAdvisoryTests);
    expect(a.breakdown).toEqual(b.breakdown);
  });

  it("returns an empty score for a car with no tests", () => {
    const { breakdown } = scoreVehicle([]);
    expect(breakdown.total).toBe(0);
    expect(breakdown.band).toBe("Low");
  });
});

describe("mileage anomaly scoring", () => {
  it("detects mileage rollback in anomaly fixture", () => {
    const { mileageAnomalies } = scoreVehicle(mileageAnomalyTests);
    const rollback = mileageAnomalies.find((a) => a.type === "ROLLBACK");
    expect(rollback).toBeDefined();
  });

  it("adds mileage score for rollback", () => {
    const { breakdown } = scoreVehicle(mileageAnomalyTests);
    expect(breakdown.mileage).toBeGreaterThan(0);
  });

  it("does not flag rollback in clean car", () => {
    const { mileageAnomalies } = scoreVehicle(cleanCarTests);
    const rollback = mileageAnomalies.find((a) => a.type === "ROLLBACK");
    expect(rollback).toBeUndefined();
  });
});
