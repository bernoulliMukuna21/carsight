import type { MotIssue, ClassifiedIssue, IssueFamily } from "@/core/domain/types";
import { TAXONOMY, FALLBACK_FAMILY } from "./taxonomy";

/** Deterministic keyword-based classification. No AI involved. */
export function classifyIssue(issue: MotIssue): ClassifiedIssue {
  const lower = issue.text.toLowerCase();

  for (const rule of TAXONOMY) {
    for (const keyword of rule.keywords) {
      if (lower.includes(keyword)) {
        return { ...issue, family: rule.family };
      }
    }
  }

  return { ...issue, family: FALLBACK_FAMILY };
}

export function classifyAll(issues: MotIssue[]): ClassifiedIssue[] {
  return issues.map(classifyIssue);
}

/** Group classified issues by family. */
export function groupByFamily(
  issues: ClassifiedIssue[]
): Map<IssueFamily, ClassifiedIssue[]> {
  const map = new Map<IssueFamily, ClassifiedIssue[]>();
  for (const issue of issues) {
    const existing = map.get(issue.family) ?? [];
    existing.push(issue);
    map.set(issue.family, existing);
  }
  return map;
}
