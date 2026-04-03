import type { MotTest, MotIssue, IssueType } from "@/core/domain/types";
import type { DvsaVehicleResponse, DvsaDefect } from "./client";

function mapDefectType(dvsaType: string, dangerous: boolean): IssueType {
  if (dangerous || dvsaType === "DANGEROUS") return "DANGEROUS";
  if (dvsaType === "MAJOR") return "MAJOR";
  if (dvsaType === "MINOR" || dvsaType === "PRS") return "MINOR";
  return "ADVISORY";
}

function mapDefect(defect: DvsaDefect): MotIssue {
  return {
    text: defect.text,
    type: mapDefectType(defect.type, defect.dangerous),
  };
}

export function mapDvsaResponse(raw: DvsaVehicleResponse): MotTest[] {
  return (raw.motTests ?? []).map((test) => ({
    date: test.completedDate.split("T")[0], // normalise to YYYY-MM-DD
    result: test.testResult === "PASSED" ? "PASS" : "FAIL",
    mileage:
      test.odometerValue != null ? parseInt(test.odometerValue, 10) : null,
    issues: (test.defects ?? []).map(mapDefect),
  }));
}
