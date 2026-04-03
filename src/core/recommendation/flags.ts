import type { MotTest, CautionFlag, ClassifiedIssue } from "@/core/domain/types";
import { classifyAll } from "@/core/classification/classifier";
import { mileageScore } from "@/core/scoring/mileage";

const RECENT_MONTHS = 14; // "recent period" = ~12 months with buffer

function monthsAgo(dateIso: string): number {
  const d = new Date(dateIso);
  const now = new Date();
  return (
    (now.getFullYear() - d.getFullYear()) * 12 +
    (now.getMonth() - d.getMonth())
  );
}

export function evaluateCautionFlags(tests: MotTest[]): CautionFlag[] {
  const flags: CautionFlag[] = [];

  // 1. Recent dangerous defect
  for (const test of tests) {
    if (monthsAgo(test.date) > RECENT_MONTHS) continue;
    const hasDangerous = test.issues.some((i) => i.type === "DANGEROUS");
    if (hasDangerous) {
      flags.push({
        type: "RECENT_DANGEROUS_DEFECT",
        description:
          "A dangerous defect was recorded in a recent MOT test. This represents a serious safety risk.",
      });
      break;
    }
  }

  // 2. Recent major brake or steering defect
  for (const test of tests) {
    if (monthsAgo(test.date) > RECENT_MONTHS) continue;
    const classified: ClassifiedIssue[] = classifyAll(test.issues);
    const hasMajorBrakeOrSteering = classified.some(
      (i) =>
        (i.type === "MAJOR" || i.type === "DANGEROUS") &&
        (i.family === "Brakes" || i.family === "Steering")
    );
    if (hasMajorBrakeOrSteering) {
      flags.push({
        type: "RECENT_MAJOR_BRAKES_OR_STEERING",
        description:
          "A major brake or steering defect was recorded recently. These are primary safety systems.",
      });
      break;
    }
  }

  // 3. Mileage rollback signal
  const { anomalies } = mileageScore(tests);
  const hasRollback = anomalies.some((a) => a.type === "ROLLBACK");
  if (hasRollback) {
    flags.push({
      type: "MILEAGE_ROLLBACK",
      description:
        "A mileage decrease was detected between MOT tests. This may indicate odometer tampering.",
    });
  }

  // 4. Repeated structure/corrosion across 3+ cycles
  let structureCycleCount = 0;
  for (const test of tests) {
    const classified = classifyAll(test.issues);
    const hasStructure = classified.some(
      (i) => i.family === "Structure/Corrosion"
    );
    if (hasStructure) structureCycleCount++;
  }
  if (structureCycleCount >= 3) {
    flags.push({
      type: "REPEATED_STRUCTURE_CORROSION",
      description:
        "Structural corrosion or bodywork deterioration has appeared in 3 or more MOT cycles. This may indicate a worsening condition.",
    });
  }

  return flags;
}
