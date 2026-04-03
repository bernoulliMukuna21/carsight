"use client";

export function FeedbackBar() {
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Was this report useful? Your feedback helps us improve CarSight.
      </p>
      <a
        href="https://tally.so/r/lbWMB6"
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 transition-colors"
      >
        Give feedback
      </a>
    </div>
  );
}
