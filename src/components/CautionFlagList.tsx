import type { CautionFlag } from "@/core/domain/types";

export function CautionFlagList({ flags }: { flags: CautionFlag[] }) {
  if (flags.length === 0) return null;

  return (
    <div className="space-y-2">
      {flags.map((flag) => (
        <div
          key={flag.type}
          className="flex gap-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3"
        >
          <span className="text-red-500 mt-0.5 shrink-0">⚠</span>
          <p className="text-sm text-red-700 dark:text-red-400">
            {flag.description}
          </p>
        </div>
      ))}
    </div>
  );
}
