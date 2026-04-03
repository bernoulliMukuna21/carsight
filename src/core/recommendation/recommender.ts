import type { VehicleReport, RecommendationResult } from "@/core/domain/types";
import { rankVehicles } from "./ranker";

export function buildRecommendation(
  ranked: VehicleReport[]
): RecommendationResult {
  // Filter out error vehicles for recommendation
  const eligible = ranked.filter((v) => !v.error);

  if (eligible.length === 0) {
    return {
      status: "HIGH_RISK",
      registration: ranked[0]?.registration ?? "UNKNOWN",
      reasons: ["No vehicles could be evaluated successfully."],
    };
  }

  const top = eligible[0];
  const reasons: string[] = [];

  // Build positive reasons
  reasons.push(
    `Lowest visible risk score in this group: ${top.score.total}/100 (${top.score.band})`
  );

  if (top.cautionFlags.length === 0 && top.score.total <= 29) {
    reasons.push("No hard caution flags detected.");
  }

  // Contextualise vs runner-up if there is one
  if (eligible.length > 1) {
    const runnerUp = eligible[1];
    const gap = runnerUp.score.total - top.score.total;
    if (gap > 0) {
      reasons.push(
        `Scores ${gap} points lower than the next option (${runnerUp.registration}: ${runnerUp.score.total}/100).`
      );
    }
  }

  // Check for caution flags on the top vehicle
  const hasHardFlags = top.cautionFlags.length > 0;

  if (hasHardFlags) {
    const flagDescriptions = top.cautionFlags.map((f) => f.description);
    return {
      status: "CAUTION",
      registration: top.registration,
      reasons: [
        `Lowest visible risk in this group but has caution flags that require careful inspection.`,
        ...flagDescriptions,
      ],
    };
  }

  if (top.score.band === "High" || top.score.band === "Very High") {
    return {
      status: "CAUTION",
      registration: top.registration,
      reasons: [
        `Lowest visible risk in this group, but the score is ${top.score.band.toLowerCase()} — inspect carefully before proceeding.`,
        ...reasons.slice(1),
      ],
    };
  }

  return {
    status: "RECOMMENDED",
    registration: top.registration,
    reasons,
  };
}

/** Main entry point for comparison mode. */
export function runRecommendation(vehicles: VehicleReport[]): {
  ranked: VehicleReport[];
  recommendation: RecommendationResult;
} {
  const ranked = rankVehicles(vehicles);
  const recommendation = buildRecommendation(ranked);
  return { ranked, recommendation };
}
