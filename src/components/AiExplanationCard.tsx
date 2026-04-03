import type { AiExplanation } from "@/core/domain/types";

export function AiExplanationCard({
  explanation,
}: {
  explanation: AiExplanation;
}) {
  return (
    <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-blue-600 dark:text-blue-400 text-lg">✦</span>
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 text-sm">
          AI Summary
        </h3>
        <span className="text-xs text-blue-500 dark:text-blue-400 ml-auto">
          Based on MOT evidence only
        </span>
      </div>

      {explanation.keyRisks.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
            Key risks
          </p>
          <ul className="space-y-1">
            {explanation.keyRisks.map((risk, i) => (
              <li key={i} className="text-sm text-blue-800 dark:text-blue-300 flex gap-2">
                <span className="shrink-0">•</span>
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400 mb-1">
          What this means
        </p>
        <p className="text-sm text-blue-800 dark:text-blue-300">
          {explanation.whatTheyMean}
        </p>
      </div>

      {explanation.nextSteps.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
            What to do next
          </p>
          <ul className="space-y-1">
            {explanation.nextSteps.map((step, i) => (
              <li key={i} className="text-sm text-blue-800 dark:text-blue-300 flex gap-2">
                <span className="shrink-0 font-bold">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-blue-600/70 dark:text-blue-500/70 italic border-t border-blue-200 dark:border-blue-800 pt-3">
        {explanation.disclaimer}
      </p>
    </div>
  );
}
