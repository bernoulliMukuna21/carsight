import type { MotTest, IssueFamily } from "@/core/domain/types";
import { classifyAll } from "@/core/classification/classifier";

const CAP = 20;

// How much each family's repetition contributes to the score.
// Safety-critical systems (brakes, steering, structure) escalate faster when
// they recur. Tyres are consumable — repeated tyre advisories are normal wear
// and should not penalise as heavily as repeated structural or brake issues.
const FAMILY_REPETITION_WEIGHT: Partial<Record<IssueFamily, number>> = {
  "Structure/Corrosion": 2.0,
  "Brakes": 1.5,
  "Steering": 1.5,
  "Seat belts/Airbags/SRS": 1.5,
  "Suspension": 1.2,
  "Tyres/Wheels": 0.6,
};

function familyWeight(family: IssueFamily): number {
  return FAMILY_REPETITION_WEIGHT[family] ?? 1.0;
}

interface CycleFamily {
  family: IssueFamily;
  hasFailure: boolean;
}

// For each MOT test, collect which families appeared and if any were failures.
function getFamiliesPerCycle(tests: MotTest[]): CycleFamily[][] {
  return tests.map((test) => {
    const classified = classifyAll(test.issues);
    const familyMap = new Map<IssueFamily, boolean>();
    for (const issue of classified) {
      const wasFailure = issue.type === "MAJOR" || issue.type === "DANGEROUS";
      familyMap.set(
        issue.family,
        (familyMap.get(issue.family) ?? false) || wasFailure
      );
    }
    return Array.from(familyMap.entries()).map(([family, hasFailure]) => ({
      family,
      hasFailure,
    }));
  });
}

export function repetitionScore(tests: MotTest[]): number {
  if (tests.length < 2) return 0;

  const cycles = getFamiliesPerCycle(tests);
  let score = 0;

  // Count how many cycles each family appears in
  const familyCycleCount = new Map<IssueFamily, number>();
  const familyHadFailure = new Map<IssueFamily, boolean>();

  for (const cycle of cycles) {
    for (const { family, hasFailure } of cycle) {
      familyCycleCount.set(family, (familyCycleCount.get(family) ?? 0) + 1);
      if (hasFailure) {
        familyHadFailure.set(family, true);
      }
    }
  }

  for (const [family, count] of familyCycleCount) {
    if (count >= 2) {
      const w = familyWeight(family);
      score += (count - 1) * 3 * w;
      if (familyHadFailure.get(family)) {
        score += 4 * w;
      }
    }
  }

  // Consecutive cycles: adjacent repetition is worse, weighted by family
  for (let i = 0; i < cycles.length - 1; i++) {
    const currentFamilies = new Set(cycles[i].map((c) => c.family));
    const nextFamilies = new Set(cycles[i + 1].map((c) => c.family));

    for (const family of currentFamilies) {
      if (nextFamilies.has(family)) {
        score += 2 * familyWeight(family);
      }
    }
  }

  return Math.min(Math.round(score), CAP);
}
