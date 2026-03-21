/**
 * Tee assignment config stored as Tournament.teeAssignments JSON:
 * {
 *   "Men":   { "default": "White", "holes": { "10": "Red", "11": "Red", ... } },
 *   "Women": { "default": "Yellow", "holes": {} }
 * }
 *
 * "default" is the tee used for all holes unless overridden.
 * "holes" maps individual hole numbers (as strings) to a specific tee name.
 */
export interface FlightTeeConfig {
  default?: string;
  holes?: Record<string, string>;
}

export type TeeAssignments = Record<string, FlightTeeConfig>;

/**
 * Determines which tee box a player plays from.
 *
 * Priority:
 * 1. Stored tee assignments (per-hole override, then flight default)
 * 2. Hardcoded Cazenovia-style fallback (White/Red for men, Yellow for women)
 * 3. Single tee box → everyone uses it
 */
export function getTeeBoxName(
  holeNumber: number,
  genderFlight: string,
  availableTees?: string[],
  assignments?: TeeAssignments | null,
): string {
  // Single tee box — everyone uses it
  if (availableTees && availableTees.length === 1) return availableTees[0];

  // Use stored assignments if configured
  if (assignments) {
    const flightKey = isWomensFlight(genderFlight) ? "Women" : "Men";
    const config = assignments[flightKey];
    if (config) {
      // Per-hole override first
      const holeOverride = config.holes?.[String(holeNumber)];
      if (holeOverride && (!availableTees || availableTees.includes(holeOverride))) {
        return holeOverride;
      }
      // Flight default
      if (config.default && (!availableTees || availableTees.includes(config.default))) {
        return config.default;
      }
    }
  }

  // Fallback: hardcoded Cazenovia-style logic
  if (isWomensFlight(genderFlight)) {
    if (!availableTees || availableTees.includes("Yellow")) return "Yellow";
    return availableTees[availableTees.length - 1];
  }

  if (!availableTees) return holeNumber <= 9 ? "White" : "Red";

  const preferredTee = holeNumber <= 9 ? "White" : "Red";
  if (availableTees.includes(preferredTee)) return preferredTee;

  return availableTees[0];
}

export function isWomensFlight(genderFlight: string): boolean {
  return genderFlight.toLowerCase().includes("women");
}

export function isMensFlight(genderFlight: string): boolean {
  return !isWomensFlight(genderFlight);
}
