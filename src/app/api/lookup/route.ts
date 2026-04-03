import { NextRequest, NextResponse } from "next/server";
import type { LookupResponse, VehicleReport } from "@/core/domain/types";
import { processRegistrations } from "@/lib/regUtils";
import { createLogger, type Logger } from "@/core/observability/logger";
import { fetchDvsaMotHistory } from "@/core/providers/dvsa/client";
import { mapDvsaResponse } from "@/core/providers/dvsa/mapper";
import { fetchDvlaDetails } from "@/core/providers/dvla/client";
import { mapDvlaResponse } from "@/core/providers/dvla/mapper";
import { scoreVehicle } from "@/core/scoring";
import { evaluateCautionFlags } from "@/core/recommendation/flags";
import { runRecommendation } from "@/core/recommendation/recommender";
import { generateExplanation } from "@/core/ai/explainer";

const MAX_REGISTRATIONS = 10;

async function buildVehicleReport(
  registration: string,
  logger: Logger
): Promise<VehicleReport> {
  // Fetch DVSA and DVLA in parallel
  const [dvsaResult, dvlaResult] = await Promise.allSettled([
    fetchDvsaMotHistory(registration, logger),
    fetchDvlaDetails(registration, logger),
  ]);

  // Handle DVSA failure — this is critical
  if (dvsaResult.status === "rejected") {
    logger.error("DVSA fetch failed", {
      registration,
      error: String(dvsaResult.reason),
    });
    return {
      registration,
      tests: [],
      classifiedIssues: [],
      score: {
        severity: 0,
        repetition: 0,
        safety: 0,
        maintenance: 0,
        mileage: 0,
        total: 0,
        band: "Low",
      },
      cautionFlags: [],
      error: "MOT history could not be retrieved. Please try again later.",
    };
  }

  const dvsaData = dvsaResult.value;
  if (!dvsaData) {
    return {
      registration,
      tests: [],
      classifiedIssues: [],
      score: {
        severity: 0,
        repetition: 0,
        safety: 0,
        maintenance: 0,
        mileage: 0,
        total: 0,
        band: "Low",
      },
      cautionFlags: [],
      error: `No MOT history found for ${registration}. The vehicle may be too new to require an MOT, or the registration may be incorrect.`,
    };
  }

  const tests = mapDvsaResponse(dvsaData);

  // DVLA is supplementary — failure doesn't break the report
  const dvlaData =
    dvlaResult.status === "fulfilled" ? dvlaResult.value : null;
  const details =
    dvlaData ? mapDvlaResponse(dvlaData, registration) : undefined;

  const { breakdown, classifiedIssues } = scoreVehicle(tests);
  const cautionFlags = evaluateCautionFlags(tests);

  return {
    registration,
    details,
    tests,
    classifiedIssues,
    score: breakdown,
    cautionFlags,
  };
}

export async function POST(request: NextRequest) {
  const logger = createLogger();

  try {
    const body = await request.json();
    const rawRegistrations: unknown = body?.registrations;

    if (!Array.isArray(rawRegistrations) || rawRegistrations.length === 0) {
      return NextResponse.json(
        { error: "Please provide one or more registration numbers." },
        { status: 400 }
      );
    }

    const { valid, invalid } = processRegistrations(
      rawRegistrations.map(String)
    );

    if (valid.length === 0) {
      return NextResponse.json(
        {
          error: "No valid UK registration numbers found.",
          invalid,
        },
        { status: 400 }
      );
    }

    if (valid.length > MAX_REGISTRATIONS) {
      return NextResponse.json(
        {
          error: `Maximum ${MAX_REGISTRATIONS} registrations per request.`,
        },
        { status: 400 }
      );
    }

    logger.info("Lookup request", {
      count: valid.length,
      mode: valid.length === 1 ? "single" : "compare",
      invalid: invalid.length,
    });

    // Fetch all vehicles in parallel
    const reports = await Promise.all(
      valid.map((reg) => buildVehicleReport(reg, logger))
    );

    if (valid.length === 1) {
      const report = reports[0];

      // Generate AI explanation (optional, feature-flagged)
      const aiExplanation = await generateExplanation(report, logger);
      if (aiExplanation) {
        report.aiExplanation = aiExplanation;
      }

      const response: LookupResponse = { mode: "single", single: report };
      return NextResponse.json(response);
    }

    // Comparison mode
    const { ranked, recommendation } = runRecommendation(reports);

    // Generate AI explanation for top-ranked eligible vehicle only
    const topEligible = ranked.find((v) => !v.error);
    if (topEligible) {
      const aiExplanation = await generateExplanation(
        topEligible,
        logger,
        recommendation.status
      );
      if (aiExplanation) {
        topEligible.aiExplanation = aiExplanation;
      }
    }

    const response: LookupResponse = {
      mode: "compare",
      comparison: { vehicles: reports, ranked, recommendation },
    };

    return NextResponse.json(response);
  } catch (err) {
    logger.error("Lookup route error", { error: String(err) });
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
