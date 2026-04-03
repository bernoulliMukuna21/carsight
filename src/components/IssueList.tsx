import type { ClassifiedIssue, IssueType, MotTest } from "@/core/domain/types";

const TYPE_BADGE: Record<IssueType, string> = {
  DANGEROUS:
    "bg-red-200 text-red-900 dark:bg-red-800/40 dark:text-red-300",
  MAJOR:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  MINOR:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  ADVISORY:
    "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400",
};

const TYPE_ORDER: IssueType[] = ["DANGEROUS", "MAJOR", "MINOR", "ADVISORY"];

// Count clean PASS tests (no DANGEROUS issues) that occurred after a given date.
function cleanPassesAfter(testDate: string, tests: MotTest[]): number {
  return tests.filter(
    (t) =>
      t.date > testDate &&
      t.result === "PASS" &&
      !t.issues.some((i) => i.type === "DANGEROUS")
  ).length;
}

export function IssueList({
  issues,
  tests,
}: {
  issues: ClassifiedIssue[];
  tests?: MotTest[];
}) {
  if (issues.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
        No issues recorded in MOT history.
      </p>
    );
  }

  const sorted = [...issues].sort(
    (a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type)
  );

  return (
    <ul className="space-y-2">
      {sorted.map((issue, i) => {
        const year = issue.testDate
          ? new Date(issue.testDate).getFullYear()
          : null;
        const cleanSince =
          issue.type === "DANGEROUS" && issue.testDate && tests
            ? cleanPassesAfter(issue.testDate, tests)
            : 0;

        return (
          <li key={i} className="flex gap-3 items-start text-sm">
            <span
              className={`shrink-0 mt-0.5 text-xs font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide ${TYPE_BADGE[issue.type]}`}
            >
              {issue.type}
            </span>
            <span className="text-gray-700 dark:text-gray-300 leading-relaxed">
              <span className="font-medium text-gray-500 dark:text-gray-400 mr-1">
                {issue.family}:
              </span>
              {issue.text}
              {year && (
                <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                  ({year})
                </span>
              )}
              {cleanSince > 0 && (
                <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-medium">
                  · {cleanSince} clean MOT{cleanSince > 1 ? "s" : ""} since
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
