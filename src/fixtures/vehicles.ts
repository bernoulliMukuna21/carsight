import type { MotTest, VehicleDetails } from "@/core/domain/types";

// ── Fixture 1: Clean car — Low risk, clear RECOMMENDED ────────────────────

export const cleanCarReg = "AB12CDE";

export const cleanCarDetails: VehicleDetails = {
  registration: cleanCarReg,
  make: "TOYOTA",
  model: "YARIS",
  colour: "SILVER",
  yearOfManufacture: 2018,
  fuelType: "PETROL",
  engineCapacity: 1000,
};

export const cleanCarTests: MotTest[] = [
  {
    date: "2024-11-15",
    result: "PASS",
    mileage: 41200,
    issues: [
      { text: "Nearside rear tyre slightly worn but serviceable", type: "ADVISORY" },
    ],
  },
  {
    date: "2023-10-20",
    result: "PASS",
    mileage: 33800,
    issues: [],
  },
  {
    date: "2022-10-05",
    result: "PASS",
    mileage: 26100,
    issues: [],
  },
];

// ── Fixture 2: Repeat advisory car — Mild/Moderate, CAUTION ──────────────

export const repeatAdvisoryReg = "CD34EFG";

export const repeatAdvisoryDetails: VehicleDetails = {
  registration: repeatAdvisoryReg,
  make: "FORD",
  model: "FOCUS",
  colour: "BLUE",
  yearOfManufacture: 2015,
  fuelType: "DIESEL",
  engineCapacity: 1600,
};

export const repeatAdvisoryTests: MotTest[] = [
  {
    date: "2024-09-10",
    result: "PASS",
    mileage: 87400,
    issues: [
      { text: "Offside front suspension arm bush deteriorated", type: "ADVISORY" },
      { text: "Nearside front suspension arm bush deteriorated", type: "ADVISORY" },
      { text: "Brake fluid contaminated - should be renewed", type: "ADVISORY" },
    ],
  },
  {
    date: "2023-08-22",
    result: "PASS",
    mileage: 79600,
    issues: [
      { text: "Offside front suspension arm bush deteriorated", type: "ADVISORY" },
      { text: "Nearside front suspension arm bush deteriorated", type: "ADVISORY" },
    ],
  },
  {
    date: "2022-08-01",
    result: "FAIL",
    mileage: 71900,
    issues: [
      { text: "Offside front suspension arm bush excessively deteriorated", type: "MAJOR" },
      { text: "Nearside rear brake binding", type: "MAJOR" },
      { text: "Engine management light illuminated", type: "MINOR" },
    ],
  },
  {
    date: "2021-07-15",
    result: "PASS",
    mileage: 64200,
    issues: [
      { text: "Offside front suspension arm bush slightly deteriorated", type: "ADVISORY" },
    ],
  },
];

// ── Fixture 3: Recent dangerous defect car — High risk, HIGH_RISK ─────────

export const dangerousDefectReg = "EF56GHI";

export const dangerousDefectDetails: VehicleDetails = {
  registration: dangerousDefectReg,
  make: "VAUXHALL",
  model: "ASTRA",
  colour: "BLACK",
  yearOfManufacture: 2012,
  fuelType: "PETROL",
  engineCapacity: 1400,
};

export const dangerousDefectTests: MotTest[] = [
  {
    date: "2026-01-08",
    result: "FAIL",
    mileage: 114300,
    issues: [
      {
        text: "Offside front brake disc worn below minimum thickness",
        type: "DANGEROUS",
        location: "offside front",
      },
      {
        text: "Nearside front brake disc worn below minimum thickness",
        type: "DANGEROUS",
        location: "nearside front",
      },
      { text: "Nearside front tyre tread depth below legal limit", type: "DANGEROUS" },
      { text: "Exhaust blowing near manifold", type: "ADVISORY" },
    ],
  },
  {
    date: "2024-01-15",
    result: "PASS",
    mileage: 106700,
    issues: [
      { text: "Nearside front brake pad worn", type: "ADVISORY" },
      { text: "Exhaust slightly blowing", type: "ADVISORY" },
    ],
  },
  {
    date: "2023-01-20",
    result: "PASS",
    mileage: 98100,
    issues: [
      { text: "Nearside rear tyre worn", type: "ADVISORY" },
    ],
  },
];

// ── Fixture 4: Mileage anomaly car — hard caution flag ────────────────────

export const mileageAnomalyReg = "GH78IJK";

export const mileageAnomalyDetails: VehicleDetails = {
  registration: mileageAnomalyReg,
  make: "BMW",
  model: "3 SERIES",
  colour: "WHITE",
  yearOfManufacture: 2014,
  fuelType: "DIESEL",
  engineCapacity: 2000,
};

export const mileageAnomalyTests: MotTest[] = [
  {
    date: "2024-06-12",
    result: "PASS",
    mileage: 62100,
    issues: [
      { text: "Rear silencer corroded", type: "ADVISORY" },
    ],
  },
  {
    date: "2023-05-18",
    result: "PASS",
    mileage: 98400, // ← suspicious drop from 98k to 62k the following year
    issues: [],
  },
  {
    date: "2022-04-22",
    result: "PASS",
    mileage: 89700,
    issues: [],
  },
  {
    date: "2021-03-11",
    result: "PASS",
    mileage: 81200,
    issues: [
      { text: "Offside front tyre worn close to limit", type: "ADVISORY" },
    ],
  },
];

// ── Fixture 5: Mixed shortlist (5 cars) for comparison mode ───────────────
// Combines the above 4 plus one extra mid-range vehicle

export const midRangeReg = "IJ90KLM";

export const midRangeDetails: VehicleDetails = {
  registration: midRangeReg,
  make: "VOLKSWAGEN",
  model: "GOLF",
  colour: "GREY",
  yearOfManufacture: 2016,
  fuelType: "PETROL",
  engineCapacity: 1400,
};

export const midRangeTests: MotTest[] = [
  {
    date: "2024-08-20",
    result: "PASS",
    mileage: 67800,
    issues: [
      { text: "Offside rear shock absorber slightly leaking", type: "ADVISORY" },
      { text: "Nearside front CV boot split - no grease loss", type: "ADVISORY" },
    ],
  },
  {
    date: "2023-07-14",
    result: "FAIL",
    mileage: 60400,
    issues: [
      { text: "Offside front fog lamp not working", type: "MINOR" },
      { text: "Wiper blades smearing", type: "MINOR" },
    ],
  },
  {
    date: "2022-07-02",
    result: "PASS",
    mileage: 53200,
    issues: [
      { text: "Coolant level low", type: "ADVISORY" },
    ],
  },
];

// ── Registry map for mock provider lookups ────────────────────────────────

export const FIXTURE_REGISTRY: Record<
  string,
  { details: VehicleDetails; tests: MotTest[] }
> = {
  [cleanCarReg]: { details: cleanCarDetails, tests: cleanCarTests },
  [repeatAdvisoryReg]: { details: repeatAdvisoryDetails, tests: repeatAdvisoryTests },
  [dangerousDefectReg]: { details: dangerousDefectDetails, tests: dangerousDefectTests },
  [mileageAnomalyReg]: { details: mileageAnomalyDetails, tests: mileageAnomalyTests },
  [midRangeReg]: { details: midRangeDetails, tests: midRangeTests },
};
