import type { VehicleDetails } from "@/core/domain/types";
import type { DvlaVehicleResponse } from "./client";

export function mapDvlaResponse(
  raw: DvlaVehicleResponse,
  registration: string
): VehicleDetails {
  return {
    registration,
    make: raw.make,
    colour: raw.colour,
    yearOfManufacture: raw.yearOfManufacture,
    fuelType: raw.fuelType,
    engineCapacity: raw.engineCapacity,
    motExpiryDate: raw.motExpiryDate,
  };
}
