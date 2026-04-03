import type { ClassifiedIssue, IssueFamily } from "@/core/domain/types";
import { recencyMultiplier } from "./severity";

const CAP = 20;

// Max weight per safety-critical family
const FAMILY_SAFETY_WEIGHTS: Partial<Record<IssueFamily, number>> = {
  "Structure/Corrosion": 7,
  "Brakes": 6,
  "Steering": 6,
  "Seat belts/Airbags/SRS": 6,
  "Suspension": 5,
  "Tyres/Wheels": 5,
  "Exhaust/Emissions": 3,
  "Engine management/MIL": 3,
  "Fluid leaks": 3,
  "Visibility/Windscreen/Wipers": 2,
  "Lighting/Electrics": 2,
};

const ISSUE_TYPE_MULTIPLIER = {
  ADVISORY: 0.2,
  MINOR: 0.4,
  MAJOR: 0.8,
  DANGEROUS: 1.0,
} as const;

interface IssueWithDate extends ClassifiedIssue {
  testDate: string;
}

export function safetyScore(issuesWithDates: IssueWithDate[]): number {
  let total = 0;

  for (const issue of issuesWithDates) {
    const familyWeight = FAMILY_SAFETY_WEIGHTS[issue.family];
    if (!familyWeight) continue;

    const typeMultiplier = ISSUE_TYPE_MULTIPLIER[issue.type];
    const recency = recencyMultiplier(issue.testDate);

    total += familyWeight * typeMultiplier * recency;
  }

  return Math.min(Math.round(total), CAP);
}
