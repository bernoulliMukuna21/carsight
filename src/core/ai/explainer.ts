import Anthropic from "@anthropic-ai/sdk";
import type { VehicleReport, AiExplanation, RecommendationStatus } from "@/core/domain/types";
import { env } from "@/lib/env";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt";
import { AI_EXPLANATION_SCHEMA, parseExplanation } from "./schema";
import type { Logger } from "@/core/observability/logger";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    if (!env.anthropic.apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    _client = new Anthropic({ apiKey: env.anthropic.apiKey });
  }
  return _client;
}

export async function generateExplanation(
  report: VehicleReport,
  logger: Logger,
  recommendationStatus?: RecommendationStatus
): Promise<AiExplanation | null> {
  if (!env.aiEnabled) {
    logger.info("AI explanation disabled", { registration: report.registration });
    return null;
  }

  try {
    const client = getClient();
    const userPrompt = buildUserPrompt(report, recommendationStatus);

    const response = await logger.timed(
      `Claude explanation ${report.registration}`,
      async () =>
        client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }],
          tools: [
            {
              name: "provide_explanation",
              description: "Provide a structured MOT risk explanation",
              input_schema: AI_EXPLANATION_SCHEMA as Anthropic.Tool["input_schema"],
            },
          ],
          tool_choice: { type: "any" },
        })
    );

    // Extract tool use result
    const toolUse = response.content.find((c) => c.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      logger.warn("Claude returned no tool use block", {
        registration: report.registration,
      });
      return null;
    }

    const explanation = parseExplanation(toolUse.input);
    if (!explanation) {
      logger.warn("Claude explanation failed schema validation", {
        registration: report.registration,
      });
      return null;
    }

    return explanation;
  } catch (err) {
    logger.error("Claude explanation failed", {
      registration: report.registration,
      error: String(err),
    });
    return null; // Graceful degradation — core report still works
  }
}
