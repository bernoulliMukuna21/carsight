import type { MotTest } from "@/core/domain/types";

const CAP = 15;

export function maintenanceScore(tests: MotTest[]): number {
  if (tests.length === 0) return 0;

  let score = 0;

  const failures = tests.filter((t) => t.result === "FAIL").length;
  const failureRate = failures / tests.length;

  // High failure rate penalty
  if (failureRate >= 0.5) score += 8;
  else if (failureRate >= 0.33) score += 5;
  else if (failureRate > 0) score += 2;

  // Advisory count clustering — many advisories at once suggests neglect
  for (const test of tests) {
    const advisoryCount = test.issues.filter(
      (i) => i.type === "ADVISORY"
    ).length;
    if (advisoryCount >= 5) score += 4;
    else if (advisoryCount >= 3) score += 2;
    else if (advisoryCount >= 2) score += 1;
  }

  // Many total issues in latest test
  const latestTest = tests[0];
  if (latestTest) {
    const majorOrDangerous = latestTest.issues.filter(
      (i) => i.type === "MAJOR" || i.type === "DANGEROUS"
    ).length;
    if (majorOrDangerous >= 3) score += 3;
    else if (majorOrDangerous >= 2) score += 2;
  }

  // Any DANGEROUS item in history means the car reached a legally unsafe state —
  // a meaningful distinction from a car that never did.
  const everDangerous = tests.some((t) =>
    t.issues.some((i) => i.type === "DANGEROUS")
  );
  if (everDangerous) score += 3;

  // DANGEROUS items appearing across multiple MOT tests signal a pattern of neglect,
  // not an isolated incident — penalise regardless of how old the individual tests are.
  const testsWithDangerous = tests.filter((t) =>
    t.issues.some((i) => i.type === "DANGEROUS")
  ).length;
  if (testsWithDangerous >= 2) score += 4;

  return Math.min(Math.round(score), CAP);
}
