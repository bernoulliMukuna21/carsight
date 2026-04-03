"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import type { ComparisonReport, VehicleReport, RecommendationStatus } from "@/core/domain/types";
import { ScoreBadge } from "@/components/ScoreBadge";
import { CautionFlagList } from "@/components/CautionFlagList";
import { AiExplanationCard } from "@/components/AiExplanationCard";
import { IssueList } from "@/components/IssueList";

const STATUS_STYLES: Record<RecommendationStatus, string> = {
  RECOMMENDED:
    "bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700",
  CAUTION:
    "bg-yellow-50 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700",
  HIGH_RISK:
    "bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700",
};

const STATUS_TEXT: Record<RecommendationStatus, string> = {
  RECOMMENDED: "text-green-800 dark:text-green-300",
  CAUTION: "text-yellow-800 dark:text-yellow-300",
  HIGH_RISK: "text-red-800 dark:text-red-300",
};

const STATUS_ICON: Record<RecommendationStatus, string> = {
  RECOMMENDED: "✓",
  CAUTION: "⚠",
  HIGH_RISK: "✕",
};

const STATUS_LABEL: Record<RecommendationStatus, string> = {
  RECOMMENDED: "Recommended",
  CAUTION: "Inspect carefully",
  HIGH_RISK: "High risk",
};

export default function ComparePage() {
  const router = useRouter();
  const posthog = usePostHog();
  const [comparison, setComparison] = useState<ComparisonReport | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("comparison");
    if (stored) {
      const data = JSON.parse(stored);
      setComparison(data);
      posthog.capture("comparison_viewed", {
        vehicle_count: data.ranked?.length ?? 0,
        top_pick: data.recommendation?.registration,
        top_pick_status: data.recommendation?.status,
      });
    } else {
      router.push("/");
    }
  }, [router, posthog]);

  if (!comparison) return null;

  const { ranked, recommendation } = comparison;

  return (
    <div className="space-y-8">
      {/* Back link */}
      <button
        onClick={() => router.push("/")}
        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1"
      >
        ← Check different registrations
      </button>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Comparison
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {ranked.length} vehicle{ranked.length !== 1 ? "s" : ""} ranked by
          visible MOT risk (lowest first)
        </p>
      </div>

      {/* Recommendation banner */}
      <div
        className={`rounded-2xl border-2 px-6 py-5 space-y-3 ${STATUS_STYLES[recommendation.status]}`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`text-2xl font-bold ${STATUS_TEXT[recommendation.status]}`}
          >
            {STATUS_ICON[recommendation.status]}
          </span>
          <div>
            <p
              className={`font-bold text-lg ${STATUS_TEXT[recommendation.status]}`}
            >
              {STATUS_LABEL[recommendation.status]}:{" "}
              {recommendation.registration}
            </p>
            <p
              className={`text-sm ${STATUS_TEXT[recommendation.status]} opacity-80`}
            >
              {recommendation.reasons[0]}
            </p>
          </div>
        </div>
        {recommendation.reasons.length > 1 && (
          <ul className="space-y-1">
            {recommendation.reasons.slice(1).map((reason, i) => (
              <li
                key={i}
                className={`text-sm flex gap-2 ${STATUS_TEXT[recommendation.status]} opacity-80`}
              >
                <span>•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* AI explanation for top vehicle */}
      {(() => {
        const topVehicle = ranked.find(
          (v) => v.registration === recommendation.registration && v.aiExplanation
        );
        return topVehicle?.aiExplanation ? (
          <AiExplanationCard explanation={topVehicle.aiExplanation} />
        ) : null;
      })()}

      {/* Ranked list */}
      <div className="space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          All vehicles ranked
        </h2>
        {ranked.map((vehicle, rank) => (
          <VehicleCard
            key={vehicle.registration}
            vehicle={vehicle}
            rank={rank + 1}
            isRecommended={vehicle.registration === recommendation.registration}
            isExpanded={expanded === vehicle.registration}
            onToggle={() =>
              setExpanded(
                expanded === vehicle.registration
                  ? null
                  : vehicle.registration
              )
            }
          />
        ))}
      </div>

      {/* Disclaimer */}
      <div className="rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-5 py-4 text-xs text-gray-500 dark:text-gray-400">
        Rankings are based on visible MOT history risk only. The comparison does
        not reflect hidden mechanical condition and does not replace physical
        inspections of individual vehicles.
      </div>
    </div>
  );
}

function VehicleCard({
  vehicle,
  rank,
  isRecommended,
  isExpanded,
  onToggle,
}: {
  vehicle: VehicleReport;
  rank: number;
  isRecommended: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  if (vehicle.error) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-4 flex items-center gap-4 opacity-60">
        <span className="w-7 h-7 rounded-full bg-gray-200 dark:bg-slate-700 text-gray-500 text-xs font-bold flex items-center justify-center shrink-0">
          {rank}
        </span>
        <div className="flex-1">
          <p className="font-mono font-bold text-gray-900 dark:text-white">
            {vehicle.registration}
          </p>
          <p className="text-sm text-red-500 dark:text-red-400">
            {vehicle.error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border bg-white dark:bg-slate-800 overflow-hidden transition-all ${
        isRecommended
          ? vehicle.cautionFlags.length > 0 || vehicle.score.band !== "Low"
            ? "border-amber-300 dark:border-amber-700 ring-2 ring-amber-200 dark:ring-amber-900"
            : "border-green-300 dark:border-green-700 ring-2 ring-green-200 dark:ring-green-900"
          : "border-gray-200 dark:border-slate-700"
      }`}
    >
      {/* Card header */}
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex items-center gap-4"
      >
        <span className="w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 text-xs font-bold flex items-center justify-center shrink-0">
          {rank}
        </span>
        <ScoreBadge total={vehicle.score.total} band={vehicle.score.band} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="font-mono font-bold text-gray-900 dark:text-white">
            {vehicle.registration}
          </p>
          {vehicle.details && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {vehicle.details.yearOfManufacture} {vehicle.details.make}{" "}
              {vehicle.details.model}
            </p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {vehicle.classifiedIssues.length} issue
            {vehicle.classifiedIssues.length !== 1 ? "s" : ""} ·{" "}
            {vehicle.tests.length} MOT test
            {vehicle.tests.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isRecommended && (() => {
          return vehicle.cautionFlags.length > 0 || vehicle.score.band !== "Low" ? (
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full shrink-0">
              Best available
            </span>
          ) : (
            <span className="text-xs font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full shrink-0">
              Top pick
            </span>
          );
        })()}
        {vehicle.cautionFlags.length > 0 && (
          <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full shrink-0">
            {vehicle.cautionFlags.length} flag
            {vehicle.cautionFlags.length > 1 ? "s" : ""}
          </span>
        )}
        <span className="text-gray-400 text-sm shrink-0">
          {isExpanded ? "▲" : "▼"}
        </span>
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="border-t border-gray-100 dark:border-slate-700 px-5 py-4 space-y-4">
          {vehicle.cautionFlags.length > 0 && (
            <CautionFlagList flags={vehicle.cautionFlags} />
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              Issues
            </p>
            <IssueList issues={vehicle.classifiedIssues} />
          </div>
          <a
            href={`/report/${vehicle.registration}`}
            className="inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
            onClick={() =>
              sessionStorage.setItem(
                `report:${vehicle.registration}`,
                JSON.stringify(vehicle)
              )
            }
          >
            View full report →
          </a>
        </div>
      )}
    </div>
  );
}
