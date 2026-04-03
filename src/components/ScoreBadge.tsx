import type { RiskBand } from "@/core/domain/types";

const BAND_STYLES: Record<RiskBand, string> = {
  Low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Mild: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Moderate: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  High: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  "Very High":
    "bg-red-200 text-red-900 dark:bg-red-800/40 dark:text-red-300",
};

const BAND_RING: Record<RiskBand, string> = {
  Low: "border-green-300 dark:border-green-700",
  Mild: "border-yellow-300 dark:border-yellow-700",
  Moderate: "border-orange-300 dark:border-orange-700",
  High: "border-red-300 dark:border-red-700",
  "Very High": "border-red-400 dark:border-red-600",
};

export function ScoreBadge({
  total,
  band,
  size = "md",
}: {
  total: number;
  band: RiskBand;
  size?: "sm" | "md" | "lg";
}) {
  const scoreStyle = BAND_STYLES[band];
  const ringStyle = BAND_RING[band];

  const sizeClasses = {
    sm: "w-16 h-16 text-xl",
    md: "w-24 h-24 text-3xl",
    lg: "w-32 h-32 text-4xl",
  }[size];

  const labelSize = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }[size];

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`rounded-full border-4 ${ringStyle} ${scoreStyle} ${sizeClasses} flex items-center justify-center font-bold`}
      >
        {total}
      </div>
      <span className={`font-semibold ${scoreStyle} px-2 py-0.5 rounded-full ${labelSize}`}>
        {band}
      </span>
    </div>
  );
}
