import type {
  MotTest,
  ClassifiedIssue,
  ScoreBreakdown,
  RiskBand,
} from "@/core/domain/types";
import { classifyAll } from "@/core/classification/classifier";
import { severityScore } from "./severity";
import { repetitionScore } from "./repetition";
import { safetyScore } from "./safety";
import { maintenanceScore } from "./maintenance";
import { mileageScore } from "./mileage";

function toBand(total: number): RiskBand {
  if (total <= 14) return "Low";
  if (total <= 29) return "Mild";
  if (total <= 49) return "Moderate";
  if (total <= 69) return "High";
  return "Very High";
}

export interface ScoringResult {
  breakdown: ScoreBreakdown;
  classifiedIssues: ClassifiedIssue[];
  mileageAnomalies: ReturnType<typeof mileageScore>["anomalies"];
}

// A FAIL test followed by a PASS within 30 days is a same-cycle retest: the
// owner fixed the issue promptly. The failure is already penalised by the
// maintenance failure rate; scoring the fail-test issues again in severity and
// safety double-counts the same incident. This filter removes those fail tests
// from severity/safety inputs while leaving them in repetition and maintenance.
function filterSameCycleFails(tests: MotTest[]): MotTest[] {
  // Tests are assumed newest-first (as returned by the DVSA API)
  return tests.filter((test, idx) => {
    if (test.result !== "FAIL") return true;
    const failTime = new Date(test.date).getTime();
    // Look at more-recent tests (lower indices) for a PASS within 30 days
    return !tests.slice(0, idx).some((laterTest) => {
      if (laterTest.result !== "PASS") return false;
      const daysDiff = (new Date(laterTest.date).getTime() - failTime) / 86_400_000;
      return daysDiff >= 0 && daysDiff <= 30;
    });
  });
}

// A "clean" test is a PASS with no MAJOR or DANGEROUS issues.
// Consecutive clean tests at the top of the history indicate the car has
// recovered — the score should reflect that recent good behaviour.
function countConsecutiveCleanPasses(tests: MotTest[]): number {
  let count = 0;
  for (const test of tests) {
    if (test.result !== "PASS") break;
    const hasSerious = test.issues.some(
      (i) => i.type === "MAJOR" || i.type === "DANGEROUS"
    );
    if (hasSerious) break;
    count++;
  }
  return count;
}

export function scoreVehicle(tests: MotTest[]): ScoringResult {
  // Classify all issues across all tests — used for display only
  const allClassified: ClassifiedIssue[] = [];
  tests.forEach((test) =>
    allClassified.push(
      ...classifyAll(test.issues).map((issue) => ({ ...issue, testDate: test.date }))
    )
  );

  // For severity and safety: exclude same-cycle fail tests (see above)
  const scoringTests = filterSameCycleFails(tests);
  const classifiedByTest = new Map<number, ClassifiedIssue[]>();
  scoringTests.forEach((test, idx) => {
    classifiedByTest.set(idx, classifyAll(test.issues));
  });

  const issuesWithDates = scoringTests.flatMap((test) =>
    classifyAll(test.issues).map((issue) => ({ ...issue, testDate: test.date }))
  );

  const severity = severityScore(scoringTests, classifiedByTest);
  const repetition = repetitionScore(tests);
  const safety = safetyScore(issuesWithDates);
  const maintenance = maintenanceScore(tests);
  const { score: mileage, anomalies: mileageAnomalies } = mileageScore(tests);

  const rawTotal = Math.min(
    severity + repetition + safety + maintenance + mileage,
    100
  );

  // Apply clean-run recovery: consecutive clean passes at the top of the
  // history reduce the total score. 3+ clean passes = 20% reduction,
  // 2 clean passes = 10% reduction. This rewards cars that have genuinely
  // improved and reflects that recent history matters most.
  const cleanRuns = countConsecutiveCleanPasses(tests);
  const recoveryMultiplier = cleanRuns >= 3 ? 0.8 : cleanRuns >= 2 ? 0.9 : 1.0;
  const total = Math.round(rawTotal * recoveryMultiplier);

  return {
    breakdown: {
      severity,
      repetition,
      safety,
      maintenance,
      mileage,
      total,
      band: toBand(total),
    },
    classifiedIssues: allClassified,
    mileageAnomalies,
  };
}
