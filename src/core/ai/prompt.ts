import type { VehicleReport, RecommendationStatus } from "@/core/domain/types";

export const SYSTEM_PROMPT = `You are an evidence-based MOT history analyst for a UK used-car decision assistant called CarSight.

Your ONLY job is to explain the computed MOT risk findings in plain, honest English.

STRICT RULES:
- Base your explanation ONLY on the facts provided to you. Do not invent faults, costs, or diagnoses.
- Never claim to know the current mechanical condition of the vehicle.
- Never estimate repair costs or guarantee that any fault has been fixed.
- Use calm, factual language. Do not alarm buyers unnecessarily, but do not downplay genuine risks.
- The score and classifications are already computed — your job is explanation only.
- Always remind the buyer that this is based on MOT history only and does not replace a physical inspection.`;

export function buildUserPrompt(
  report: VehicleReport,
  recommendationStatus?: RecommendationStatus
): string {
  const { registration, score, cautionFlags, classifiedIssues } = report;

  // Top issues (most severe and recent) — limit to 8 for prompt efficiency
  const topIssues = classifiedIssues
    .filter((i) => i.type === "MAJOR" || i.type === "DANGEROUS" || i.type === "ADVISORY")
    .slice(0, 8);

  const issueList =
    topIssues.length > 0
      ? topIssues
          .map((i) => `- [${i.type}] ${i.family}: "${i.text}"`)
          .join("\n")
      : "No issues recorded in MOT history.";

  const flagList =
    cautionFlags.length > 0
      ? cautionFlags.map((f) => `- ${f.type}: ${f.description}`).join("\n")
      : "None.";

  const recStatus = recommendationStatus
    ? `Recommendation status: ${recommendationStatus}`
    : "";

  return `Vehicle: ${registration}
Risk score: ${score.total}/100 (${score.band})
Score breakdown: Severity ${score.severity}, Repetition ${score.repetition}, Safety ${score.safety}, Maintenance ${score.maintenance}, Mileage ${score.mileage}
${recStatus}

Top MOT issues:
${issueList}

Caution flags:
${flagList}

Based ONLY on the above computed facts, generate an explanation for a used-car buyer.`;
}
