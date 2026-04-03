"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  cleanCarReg,
  repeatAdvisoryReg,
  dangerousDefectReg,
  midRangeReg,
} from "@/fixtures/vehicles";
import { RegTagInput } from "@/components/RegTagInput";

export default function HomePage() {
  const router = useRouter();
  const [regs, setRegs] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = sessionStorage.getItem("lastRegs");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (regs.length === 0) {
      setError("Please enter at least one registration number.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrations: regs }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      if (data.mode === "single") {
        router.push(`/report/${data.single.registration}`);
        // Store result in sessionStorage for the report page
        sessionStorage.setItem(
          `report:${data.single.registration}`,
          JSON.stringify(data.single)
        );
      } else {
        sessionStorage.setItem("comparison", JSON.stringify(data.comparison));
        router.push("/compare");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function loadExample(examples: string[]) {
    setRegs(examples);
    setError(null);
  }

  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="flex flex-col lg:flex-row items-center gap-10 pt-4">
        <div className="flex-1 space-y-4 text-center lg:text-left">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Which car on your shortlist should you buy?
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            You&apos;ve saved a shortlist of cars. Paste their reg numbers and
            we&apos;ll rank them by MOT risk — so you know which one to go and
            view first, and which ones to skip.
          </p>
        </div>
        <div className="flex-shrink-0 w-full lg:w-80">
          <CarIllustration />
        </div>
      </div>

      {/* Mock preview */}
      <MockComparisonPreview />

      {/* Lookup form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 space-y-4"
      >
        <RegTagInput
          value={regs}
          onChange={(tags) => {
            setRegs(tags);
            setError(null);
            sessionStorage.setItem("lastRegs", JSON.stringify(tags));
          }}
        />

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {loading ? "Ranking…" : "Rank my shortlist"}
        </button>
      </form>

      {/* Example shortcuts */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Try an example
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ExampleCard
            title="Comparison: shortlist of 4"
            description="See how 4 cars stack up — with a clear winner and one to avoid"
            onClick={() =>
              loadExample([
                cleanCarReg,
                repeatAdvisoryReg,
                dangerousDefectReg,
                midRangeReg,
              ])
            }
          />
          <ExampleCard
            title="Single clean car"
            description="Toyota Yaris — low risk, passes consistently"
            onClick={() => loadExample([cleanCarReg])}
          />
          <ExampleCard
            title="Repeat advisory car"
            description="Ford Focus — suspension issues recurring across cycles"
            onClick={() => loadExample([repeatAdvisoryReg])}
          />
          <ExampleCard
            title="Recent dangerous defect"
            description="Vauxhall Astra — dangerous brake defect recorded this year"
            onClick={() => loadExample([dangerousDefectReg])}
          />
        </div>
      </div>

      {/* How it works */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          How it works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Step
            number={1}
            icon={<IconListing />}
            title="Copy regs from any listing"
            description="Browsing AutoTrader, eBay, or Gumtree? Copy the registration from each car you're considering."
          />
          <Step
            number={2}
            icon={<IconRanking />}
            title="We rank your shortlist"
            description="Our engine scores each car's MOT history — defect severity, recency, and repetition — and ranks them."
          />
          <Step
            number={3}
            icon={<IconTarget />}
            title="Know which car to view first"
            description="Get a ranked recommendation with the evidence behind every score. Skip the spreadsheets."
          />
        </div>
      </div>

      {/* Trust note */}
      <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-6 py-5 text-sm text-blue-800 dark:text-blue-300">
        <strong>CarSight scores visible MOT history risk only.</strong> It does
        not diagnose hidden mechanical faults or replace a professional
        inspection. Use it to shortlist smarter and ask better questions before
        you buy.
      </div>
    </div>
  );
}

const mockCars = [
  {
    rank: 1,
    reg: "AB12CDE",
    label: "Recommended",
    detail: "Score 87 · Clean history",
    classes:
      "bg-green-50 border-green-300 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300",
    badgeClasses:
      "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  },
  {
    rank: 2,
    reg: "CD34EFG",
    label: "Caution",
    detail: "Score 61 · Repeat advisories",
    classes:
      "bg-yellow-50 border-yellow-300 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-300",
    badgeClasses:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  },
  {
    rank: 3,
    reg: "EF56GHI",
    label: "High Risk",
    detail: "Score 28 · Dangerous defect",
    classes:
      "bg-red-50 border-red-300 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300",
    badgeClasses:
      "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  },
];

function MockComparisonPreview() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Here&apos;s what you get:
        </p>
        <span className="text-xs text-gray-400 dark:text-gray-500 italic">
          Example output
        </span>
      </div>
      <div className="space-y-2">
        {mockCars.map((car) => (
          <div
            key={car.rank}
            className={`flex items-center justify-between rounded-lg border px-4 py-3 ${car.classes}`}
          >
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-white/60 dark:bg-black/20 text-xs font-bold flex items-center justify-center">
                {car.rank}
              </span>
              <span className="font-mono font-semibold text-sm">{car.reg}</span>
              <span className="text-xs opacity-70">{car.detail}</span>
            </div>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${car.badgeClasses}`}
            >
              {car.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExampleCard({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-4 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors space-y-1"
    >
      <p className="font-medium text-gray-900 dark:text-white text-sm">
        {title}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
    </button>
  );
}

function Step({
  number,
  icon,
  title,
  description,
}: {
  number: number;
  icon?: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        )}
        <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
          {number}
        </div>
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
}

function CarIllustration() {
  return (
    <svg
      viewBox="0 0 320 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full"
      aria-hidden="true"
    >
      {/* Shadow */}
      <ellipse cx="160" cy="148" rx="128" ry="7" fill="#1f2937" opacity="0.08" />

      {/* Car body — lower section */}
      <rect x="22" y="86" width="276" height="42" rx="10" fill="#2563eb" />

      {/* Car cabin — upper section */}
      <path
        d="M 78,86 C 82,54 98,38 122,36 L 200,36 C 220,36 238,52 248,74 L 256,86 Z"
        fill="#1d4ed8"
      />

      {/* Windows */}
      <path
        d="M 86,83 C 90,56 104,42 124,40 L 197,40 C 215,40 230,54 238,74 L 244,83 Z"
        fill="#bfdbfe"
        opacity="0.75"
      />

      {/* Door pillar dividing front/rear window */}
      <rect x="164" y="40" width="4" height="43" rx="2" fill="#1d4ed8" />

      {/* Rear wheel */}
      <circle cx="82" cy="120" r="26" fill="#111827" />
      <circle cx="82" cy="120" r="16" fill="#374151" />
      <circle cx="82" cy="120" r="7" fill="#6b7280" />
      <circle cx="82" cy="120" r="3" fill="#9ca3af" />

      {/* Front wheel */}
      <circle cx="238" cy="120" r="26" fill="#111827" />
      <circle cx="238" cy="120" r="16" fill="#374151" />
      <circle cx="238" cy="120" r="7" fill="#6b7280" />
      <circle cx="238" cy="120" r="3" fill="#9ca3af" />

      {/* Headlights (front = right) */}
      <rect x="290" y="90" width="9" height="20" rx="3" fill="#fef9c3" />
      <rect x="290" y="112" width="9" height="8" rx="2" fill="#fde68a" opacity="0.6" />

      {/* Taillights (rear = left) */}
      <rect x="21" y="90" width="6" height="20" rx="3" fill="#fca5a5" />

      {/* Door handles */}
      <rect x="108" y="104" width="20" height="5" rx="2.5" fill="#1e40af" />
      <rect x="176" y="104" width="20" height="5" rx="2.5" fill="#1e40af" />

      {/* Side body crease line */}
      <line x1="30" y1="98" x2="288" y2="98" stroke="#3b82f6" strokeWidth="1.5" opacity="0.35" />
    </svg>
  );
}

function IconListing() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      {/* Browser/phone frame */}
      <rect x="3" y="2" width="22" height="24" rx="3" stroke="#2563eb" strokeWidth="1.8" />
      {/* Top bar */}
      <rect x="3" y="2" width="22" height="6" rx="3" fill="#2563eb" opacity="0.15" />
      <circle cx="7" cy="5" r="1.2" fill="#2563eb" opacity="0.5" />
      {/* List lines */}
      <line x1="8" y1="13" x2="21" y2="13" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="8" y1="17" x2="18" y2="17" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="8" y1="21" x2="20" y2="21" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconRanking() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      {/* Podium bars — 2nd, 1st, 3rd */}
      <rect x="2" y="14" width="7" height="12" rx="2" fill="#2563eb" opacity="0.5" />
      <rect x="10.5" y="8" width="7" height="18" rx="2" fill="#2563eb" />
      <rect x="19" y="17" width="7" height="9" rx="2" fill="#2563eb" opacity="0.35" />
      {/* Rank numbers */}
      <text x="5.5" y="25" fontSize="5" fill="white" textAnchor="middle" fontWeight="bold">2</text>
      <text x="14" y="25" fontSize="5" fill="white" textAnchor="middle" fontWeight="bold">1</text>
      <text x="22.5" y="25" fontSize="5" fill="white" textAnchor="middle" fontWeight="bold">3</text>
      {/* Trophy star on top of 1st */}
      <circle cx="14" cy="5" r="3" fill="#2563eb" opacity="0.8" />
      <text x="14" y="7" fontSize="5" fill="white" textAnchor="middle">★</text>
    </svg>
  );
}

function IconTarget() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      {/* Outer circle */}
      <circle cx="14" cy="14" r="11" stroke="#2563eb" strokeWidth="1.8" opacity="0.3" />
      {/* Middle circle */}
      <circle cx="14" cy="14" r="7" stroke="#2563eb" strokeWidth="1.8" opacity="0.6" />
      {/* Checkmark in centre */}
      <circle cx="14" cy="14" r="4" fill="#2563eb" />
      <path d="M 11.5,14 L 13.2,15.8 L 16.5,12.2" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
