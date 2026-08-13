export type EmergencyCategory = "medical" | "police" | "fire" | "unclear";

/**
 * The AI's real classification result can be a real category, OR
 * "none" — genuinely no apparent emergency. "none" is deliberately
 * NOT part of EmergencyCategory itself: it's never a directly-tappable
 * home-screen option, only something the AI can conclude after
 * actually understanding a description. Kept as its own type so the
 * many places EmergencyCategory is used for tap-target lookups
 * (icons, colors, labels, simulation routing) don't need to account
 * for a value that should never reach them.
 */
export type ClassificationCategory = EmergencyCategory | "none";

export interface EmergencyClassification {
  category: ClassificationCategory;
  label: string;
  confidence: number;
  reason: string;
  /** True only when this came from a real AI call (not the local fallback classifier). */
  source: "ai" | "fallback";
}

export type EmergencySimulationStage =
  | "calling"
  | "locating"
  | "finding_hospital"
  | "ambulance_en_route"
  | "arrived"
  | "transported"
  | "hospital_arrival";

export interface GuidanceStep {
  id: string;
  text: string;
}