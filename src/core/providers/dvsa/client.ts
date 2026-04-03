import type { MotTest } from "@/core/domain/types";
import { env } from "@/lib/env";
import { FIXTURE_REGISTRY } from "@/fixtures/vehicles";
import type { Logger } from "@/core/observability/logger";

// Raw DVSA API shapes (simplified — map to MotTest in mapper.ts)
export interface DvsaDefect {
  text: string;
  type: string; // "ADVISORY" | "MINOR" | "MAJOR" | "DANGEROUS" | "PRS"
  dangerous: boolean;
}

export interface DvsaMotTest {
  completedDate: string;
  testResult: string; // "PASSED" | "FAILED"
  odometerValue: string | null;
  odometerUnit: string | null;
  defects: DvsaDefect[];
}

export interface DvsaVehicleResponse {
  registration: string;
  make: string;
  model: string;
  motTests: DvsaMotTest[];
}

// ── OAuth token cache (in-memory, reset on cold start) ────────────────────

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }

  const { clientId, clientSecret, tokenUrl, scope } = env.dvsa;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope,
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(`DVSA token request failed: ${res.status}`);
  }

  const data = await res.json();
  // Cache with 60-second buffer before expiry
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return cachedToken.value;
}

// ── Mock implementation ───────────────────────────────────────────────────

function mockFetch(registration: string): DvsaVehicleResponse | null {
  const fixture = FIXTURE_REGISTRY[registration];
  if (!fixture) return null;

  return {
    registration,
    make: fixture.details.make,
    model: fixture.details.model ?? "",
    motTests: fixture.tests.map((test) => ({
      completedDate: test.date,
      testResult: test.result === "PASS" ? "PASSED" : "FAILED",
      odometerValue: test.mileage != null ? String(test.mileage) : null,
      odometerUnit: test.mileage != null ? "MI" : null,
      defects: test.issues.map((issue) => ({
        text: issue.text,
        type: issue.type,
        dangerous: issue.type === "DANGEROUS",
      })),
    })),
  };
}

// ── Real implementation ───────────────────────────────────────────────────

async function realFetch(
  registration: string,
  logger: Logger
): Promise<DvsaVehicleResponse | null> {
  const token = await getAccessToken();
  const url = `${env.dvsa.baseUrl}/v1/trade/vehicles/registration/${registration}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "x-api-key": env.dvsa.apiKey,
      Accept: "application/json",
    },
    next: { revalidate: 3600 }, // cache for 1 hour in Next.js
  });

  if (res.status === 404) return null;

  if (!res.ok) {
    logger.error("DVSA API error", { status: res.status, registration });
    throw new Error(`DVSA API returned ${res.status} for ${registration}`);
  }

  return res.json();
}

// ── Public interface ──────────────────────────────────────────────────────

export async function fetchDvsaMotHistory(
  registration: string,
  logger: Logger
): Promise<DvsaVehicleResponse | null> {
  if (env.dvsaMock) {
    logger.info("DVSA mock fetch", { registration });
    return mockFetch(registration);
  }
  return logger.timed(`DVSA fetch ${registration}`, () =>
    realFetch(registration, logger)
  );
}
