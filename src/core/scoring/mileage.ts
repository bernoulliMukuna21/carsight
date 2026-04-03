import type { MotTest } from "@/core/domain/types";

const CAP = 10;

// Minimum plausible miles per year for a car in regular use
const MIN_MILES_PER_YEAR = 200;
// Maximum plausible miles per year
const MAX_MILES_PER_YEAR = 40000;

export interface MileageAnomalyDetail {
  type:
    | "ROLLBACK"
    | "SUSPICIOUS_FLATLINE"
    | "ABNORMAL_JUMP"
    | "INSUFFICIENT_DATA";
  description: string;
}

export function mileageScore(tests: MotTest[]): {
  score: number;
  anomalies: MileageAnomalyDetail[];
} {
  // Need at least 2 tests with mileage to detect anomalies
  const withMileage = tests.filter((t) => t.mileage != null);
  if (withMileage.length < 2) {
    return { score: 0, anomalies: [] };
  }

  // Tests assumed to be in reverse chronological order (newest first)
  // Sort oldest-first for analysis
  const sorted = [...withMileage].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let score = 0;
  const anomalies: MileageAnomalyDetail[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];

    const mileageDiff = curr.mileage! - prev.mileage!;
    const prevDate = new Date(prev.date);
    const currDate = new Date(curr.date);
    const yearsDiff =
      (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

    if (yearsDiff <= 0) continue;

    const milesPerYear = mileageDiff / yearsDiff;

    // Rollback: mileage decreased
    if (mileageDiff < 0) {
      score += 8;
      anomalies.push({
        type: "ROLLBACK",
        description: `Mileage decreased from ${prev.mileage!.toLocaleString()} to ${curr.mileage!.toLocaleString()} miles between ${prev.date} and ${curr.date}. This may indicate odometer tampering.`,
      });
      continue;
    }

    // Suspicious flatline: barely moved over a significant period
    if (milesPerYear < MIN_MILES_PER_YEAR && yearsDiff > 0.5) {
      score += 3;
      anomalies.push({
        type: "SUSPICIOUS_FLATLINE",
        description: `Mileage only increased by ${mileageDiff.toLocaleString()} miles over approximately ${Math.round(yearsDiff * 12)} months. This is unusually low and may indicate missing history.`,
      });
      continue;
    }

    // Abnormal jump: extremely high mileage increase
    if (milesPerYear > MAX_MILES_PER_YEAR) {
      score += 2;
      anomalies.push({
        type: "ABNORMAL_JUMP",
        description: `Mileage increased by ${mileageDiff.toLocaleString()} miles (≈${Math.round(milesPerYear).toLocaleString()} miles/year) between ${prev.date} and ${curr.date}. Higher than typical usage.`,
      });
    }
  }

  return { score: Math.min(score, CAP), anomalies };
}
