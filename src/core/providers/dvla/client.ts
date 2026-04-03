import type { VehicleDetails } from "@/core/domain/types";
import { env } from "@/lib/env";
import { FIXTURE_REGISTRY } from "@/fixtures/vehicles";
import type { Logger } from "@/core/observability/logger";

// Raw DVLA VES API shape
export interface DvlaVehicleResponse {
  registrationNumber: string;
  make: string;
  colour: string;
  yearOfManufacture?: number;
  fuelType?: string;
  engineCapacity?: number;
  motExpiryDate?: string;
}

// ── Mock implementation ───────────────────────────────────────────────────

function mockFetch(registration: string): DvlaVehicleResponse | null {
  const fixture = FIXTURE_REGISTRY[registration];
  if (!fixture) return null;

  const d = fixture.details;
  return {
    registrationNumber: registration,
    make: d.make,
    colour: d.colour ?? "UNKNOWN",
    yearOfManufacture: d.yearOfManufacture,
    fuelType: d.fuelType,
    engineCapacity: d.engineCapacity,
    motExpiryDate: d.motExpiryDate,
  };
}

// ── Real implementation ───────────────────────────────────────────────────

async function realFetch(
  registration: string,
  logger: Logger
): Promise<DvlaVehicleResponse | null> {
  const url = `${env.dvla.baseUrl}/vehicle-enquiry/v1/vehicles`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "x-api-key": env.dvla.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ registrationNumber: registration }),
    next: { revalidate: 3600 },
  });

  if (res.status === 404) return null;

  if (!res.ok) {
    logger.error("DVLA API error", { status: res.status, registration });
    throw new Error(`DVLA API returned ${res.status} for ${registration}`);
  }

  return res.json();
}

// ── Public interface ──────────────────────────────────────────────────────

export async function fetchDvlaDetails(
  registration: string,
  logger: Logger
): Promise<DvlaVehicleResponse | null> {
  if (env.dvlaMock) {
    logger.info("DVLA mock fetch", { registration });
    return mockFetch(registration);
  }
  return logger.timed(`DVLA fetch ${registration}`, () =>
    realFetch(registration, logger)
  );
}
