"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import type { VehicleReport } from "@/core/domain/types";
import { ScoreBadge } from "@/components/ScoreBadge";
import { ScoreBreakdownBars } from "@/components/ScoreBreakdownBars";
import { CautionFlagList } from "@/components/CautionFlagList";
import { IssueList } from "@/components/IssueList";
import { AiExplanationCard } from "@/components/AiExplanationCard";
import { FeedbackBar } from "@/components/FeedbackBar";

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const posthog = usePostHog();
  const reg = String(params.reg).toUpperCase();
  const [report, setReport] = useState<VehicleReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    posthog.capture("report_viewed", { registration: reg });

    // First try sessionStorage (from homepage navigation)
    const stored = sessionStorage.getItem(`report:${reg}`);
    if (stored) {
      setReport(JSON.parse(stored));
      return;
    }

    // Else fetch directly
    setLoading(true);
    fetch("/api/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrations: [reg] }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setReport(data.single);
        }
      })
      .catch(() => setError("Failed to load report."))
      .finally(() => setLoading(false));
  }, [reg]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} onBack={() => router.push("/")} />;
  }

  if (!report) return null;

  if (report.error) {
    return <ErrorState message={report.error} onBack={() => router.push("/")} />;
  }

  return (
    <div className="space-y-8">
      {/* Back link */}
      <button
        onClick={() => router.back()}
        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1"
      >
        ← Back
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <ScoreBadge total={report.score.total} band={report.score.band} size="lg" />
        <div className="flex-1 space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {reg}
          </h1>
          {report.details && (
            <p className="text-gray-500 dark:text-gray-400">
              {report.details.yearOfManufacture} {report.details.make}{" "}
              {report.details.model} · {report.details.colour} ·{" "}
              {report.details.fuelType}
            </p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {report.tests.length} MOT test
            {report.tests.length !== 1 ? "s" : ""} in history
          </p>
        </div>
      </div>

      {/* Caution flags */}
      {report.cautionFlags.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-red-700 dark:text-red-400">
            Caution flags
          </h2>
          <CautionFlagList flags={report.cautionFlags} />
        </section>
      )}

      {/* AI Explanation */}
      {report.aiExplanation && (
        <AiExplanationCard explanation={report.aiExplanation} />
      )}

      {/* Score breakdown */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          Score breakdown
        </h2>
        <ScoreBreakdownBars breakdown={report.score} />
        <p className="text-xs text-gray-400 dark:text-gray-500 pt-2">
          Total: {report.score.total}/100 · Band: {report.score.band}
        </p>
      </section>

      {/* Issue evidence */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          MOT issue evidence ({report.classifiedIssues.length})
        </h2>
        <IssueList issues={report.classifiedIssues} tests={report.tests} />
      </section>

      {/* MOT test timeline */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          MOT history
        </h2>
        <div className="space-y-4">
          {report.tests.map((test, i) => (
            <div
              key={i}
              className="flex gap-4 border-l-2 border-gray-200 dark:border-slate-700 pl-4"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      test.result === "PASS"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {test.result}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {test.date}
                  </span>
                  {test.mileage != null && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {test.mileage.toLocaleString()} miles
                    </span>
                  )}
                </div>
                {test.issues.length > 0 && (
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-0.5 pt-1">
                    {test.issues.map((issue, j) => (
                      <li key={j} className="flex gap-2">
                        <span
                          className={`text-xs font-semibold uppercase ${
                            issue.type === "DANGEROUS" || issue.type === "MAJOR"
                              ? "text-red-500"
                              : issue.type === "MINOR"
                              ? "text-orange-500"
                              : "text-gray-400"
                          }`}
                        >
                          {issue.type}
                        </span>
                        <span>{issue.text}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {test.issues.length === 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    No issues recorded
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <FeedbackBar />

      {/* Disclaimer */}
      <div className="rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-5 py-4 text-xs text-gray-500 dark:text-gray-400">
        This report reflects visible MOT history risk only. The score does not
        represent the current mechanical condition of the vehicle and does not
        replace a physical inspection by a qualified mechanic or a full service
        history review.
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 space-y-4">
      <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
      <p className="text-gray-500 dark:text-gray-400">
        Checking MOT history…
      </p>
    </div>
  );
}

function ErrorState({
  message,
  onBack,
}: {
  message: string;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6 py-12 text-center">
      <div className="text-5xl">⚠</div>
      <p className="text-gray-700 dark:text-gray-300">{message}</p>
      <button
        onClick={onBack}
        className="text-blue-600 hover:underline dark:text-blue-400"
      >
        ← Try another registration
      </button>
    </div>
  );
}
