import type { VehicleReport } from "@/core/domain/types";

/** Sort vehicles by total risk score ascending. Error vehicles go last. */
export function rankVehicles(vehicles: VehicleReport[]): VehicleReport[] {
  return [...vehicles].sort((a, b) => {
    // Error vehicles always last
    if (a.error && !b.error) return 1;
    if (!a.error && b.error) return -1;
    if (a.error && b.error) return 0;

    return a.score.total - b.score.total;
  });
}
