// ── Issue classification ────────────────────────────────────────────────────

export type IssueType = "ADVISORY" | "MINOR" | "MAJOR" | "DANGEROUS";

export type IssueFamily =
  | "Brakes"
  | "Steering"
  | "Suspension"
  | "Tyres/Wheels"
  | "Structure/Corrosion"
  | "Exhaust/Emissions"
  | "Engine management/MIL"
  | "Visibility/Windscreen/Wipers"
  | "Lighting/Electrics"
  | "Seat belts/Airbags/SRS"
  | "Fluid leaks"
  | "Other";

export interface MotIssue {
  text: string;
  type: IssueType;
  location?: string;
}

export interface ClassifiedIssue extends MotIssue {
  family: IssueFamily;
  subtype?: string;
  testDate?: string; // ISO date of the MOT test this issue came from
}

// ── MOT test ────────────────────────────────────────────────────────────────

export type MotTestResult = "PASS" | "FAIL" | "ABANDONED";

export interface MotTest {
  date: string; // ISO date string YYYY-MM-DD
  result: MotTestResult;
  mileage: number | null;
  issues: MotIssue[];
}

// ── Vehicle details (from DVLA) ─────────────────────────────────────────────

export interface VehicleDetails {
  registration: string;
  make: string;
  model?: string;
  colour?: string;
  yearOfManufacture?: number;
  fuelType?: string;
  engineCapacity?: number;
  motExpiryDate?: string;
}

// ── Scoring ─────────────────────────────────────────────────────────────────

export type RiskBand = "Low" | "Mild" | "Moderate" | "High" | "Very High";

export interface ScoreBreakdown {
  severity: number;    // cap 35
  repetition: number;  // cap 20
  safety: number;      // cap 20
  maintenance: number; // cap 15
  mileage: number;     // cap 10
  total: number;       // cap 100
  band: RiskBand;
}

// ── Caution flags ───────────────────────────────────────────────────────────

export type CautionFlagType =
  | "RECENT_DANGEROUS_DEFECT"
  | "RECENT_MAJOR_BRAKES_OR_STEERING"
  | "MILEAGE_ROLLBACK"
  | "REPEATED_STRUCTURE_CORROSION";

export interface CautionFlag {
  type: CautionFlagType;
  description: string;
}

// ── AI explanation ──────────────────────────────────────────────────────────

export interface AiExplanation {
  keyRisks: string[];
  whatTheyMean: string;
  nextSteps: string[];
  disclaimer: string;
}

// ── Report ──────────────────────────────────────────────────────────────────

export interface VehicleReport {
  registration: string;
  details?: VehicleDetails;
  tests: MotTest[];
  classifiedIssues: ClassifiedIssue[];
  score: ScoreBreakdown;
  cautionFlags: CautionFlag[];
  aiExplanation?: AiExplanation;
  error?: string; // set if provider fetch failed
}

// ── Recommendation ──────────────────────────────────────────────────────────

export type RecommendationStatus = "RECOMMENDED" | "CAUTION" | "HIGH_RISK";

export interface RecommendationResult {
  status: RecommendationStatus;
  registration: string;
  reasons: string[];
}

// ── Comparison ──────────────────────────────────────────────────────────────

export interface ComparisonReport {
  vehicles: VehicleReport[];
  ranked: VehicleReport[]; // sorted ascending by total score, errors last
  recommendation: RecommendationResult;
}

// ── API request / response ──────────────────────────────────────────────────

export interface LookupRequest {
  registrations: string[];
}

export type LookupMode = "single" | "compare";

export interface LookupResponse {
  mode: LookupMode;
  single?: VehicleReport;
  comparison?: ComparisonReport;
}
