import type { ScoreBreakdown } from "@/core/domain/types";

const COMPONENTS: { key: keyof ScoreBreakdown; label: string; cap: number }[] =
  [
    { key: "severity", label: "Severity", cap: 35 },
    { key: "repetition", label: "Repetition", cap: 20 },
    { key: "safety", label: "Safety-critical systems", cap: 20 },
    { key: "maintenance", label: "Maintenance behaviour", cap: 15 },
    { key: "mileage", label: "Mileage anomalies", cap: 10 },
  ];

function barColour(value: number, cap: number): string {
  const pct = value / cap;
  if (pct >= 0.75) return "bg-red-500";
  if (pct >= 0.5) return "bg-orange-400";
  if (pct >= 0.25) return "bg-yellow-400";
  return "bg-green-400";
}

export function ScoreBreakdownBars({
  breakdown,
}: {
  breakdown: ScoreBreakdown;
}) {
  return (
    <div className="space-y-3">
      {COMPONENTS.map(({ key, label, cap }) => {
        const value = breakdown[key] as number;
        const pct = Math.min((value / cap) * 100, 100);
        return (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">{label}</span>
              <span className="font-mono font-medium text-gray-900 dark:text-white">
                {value}/{cap}
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${barColour(value, cap)}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
