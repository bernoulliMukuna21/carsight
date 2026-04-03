import type { MotTest, ClassifiedIssue } from "@/core/domain/types";

const SEVERITY_WEIGHTS = {
  ADVISORY: 1,
  MINOR: 2,
  MAJOR: 6,
  DANGEROUS: 12,
} as const;

const CAP = 35;

// Tyres are consumable items — wear advisories should not dominate the score.
// MAJOR and DANGEROUS tyre issues keep full weight (a structural tyre failure
// is still genuinely dangerous regardless of category).
const TYRE_CONSUMABLE_DISCOUNT = 0.5;

// Returns a multiplier based on how many months ago the test date was.
// Steeper decay: issues 3+ years old fade quickly; recent history dominates.
export function recencyMultiplier(testDateIso: string): number {
  const testDate = new Date(testDateIso);
  const now = new Date();
  const monthsAgo =
    (now.getFullYear() - testDate.getFullYear()) * 12 +
    (now.getMonth() - testDate.getMonth());

  if (monthsAgo <= 12) return 1.0;
  if (monthsAgo <= 24) return 0.6;
  if (monthsAgo <= 36) return 0.3;
  if (monthsAgo <= 60) return 0.1;
  return 0.05;
}

export function severityScore(
  tests: MotTest[],
  classifiedByTest: Map<number, ClassifiedIssue[]>
): number {
  let total = 0;

  tests.forEach((test, idx) => {
    const multiplier = recencyMultiplier(test.date);
    const issues = classifiedByTest.get(idx) ?? [];

    for (const issue of issues) {
      let weight = SEVERITY_WEIGHTS[issue.type];
      if (
        issue.family === "Tyres/Wheels" &&
        (issue.type === "ADVISORY" || issue.type === "MINOR")
      ) {
        weight *= TYRE_CONSUMABLE_DISCOUNT;
      }
      // DANGEROUS items retain significance even in older tests — floor decay at 0.3
      // so a historical brake failure or structural defect never becomes noise.
      const recency =
        issue.type === "DANGEROUS" ? Math.max(multiplier, 0.3) : multiplier;
      total += weight * recency;
    }
  });

  return Math.min(Math.round(total), CAP);
}
