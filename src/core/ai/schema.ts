import type { AiExplanation } from "@/core/domain/types";

// JSON schema for Claude structured output
export const AI_EXPLANATION_SCHEMA = {
  type: "object",
  properties: {
    keyRisks: {
      type: "array",
      items: { type: "string" },
      description: "List of 1-4 key risk findings from the MOT evidence. Each is one sentence.",
    },
    whatTheyMean: {
      type: "string",
      description: "A 2-3 sentence plain-English explanation of what the key risks mean for a used car buyer.",
    },
    nextSteps: {
      type: "array",
      items: { type: "string" },
      description: "List of 2-4 practical actions the buyer should take before purchasing.",
    },
    disclaimer: {
      type: "string",
      description: "Standard disclaimer reminding the buyer this is based on MOT history only.",
    },
  },
  required: ["keyRisks", "whatTheyMean", "nextSteps", "disclaimer"],
  additionalProperties: false,
} as const;

export function parseExplanation(raw: unknown): AiExplanation | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  if (
    !Array.isArray(obj.keyRisks) ||
    typeof obj.whatTheyMean !== "string" ||
    !Array.isArray(obj.nextSteps) ||
    typeof obj.disclaimer !== "string"
  ) {
    return null;
  }
  return {
    keyRisks: obj.keyRisks as string[],
    whatTheyMean: obj.whatTheyMean,
    nextSteps: obj.nextSteps as string[],
    disclaimer: obj.disclaimer,
  };
}
