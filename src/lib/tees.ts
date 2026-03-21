/**
 * Determines which tee box a player plays from based on their flight and hole number.
 *
 * When availableTees has a single entry, everyone uses it (standard imported course).
 * When multiple tees exist, uses Cazenovia-style mapping:
 * - Holes 1-9: Men play White tees, Women play Yellow tees
 * - Holes 10-18: Men play Red tees, Women play Yellow tees
 * Falls back gracefully when expected tee names aren't present.
 */
export function getTeeBoxName(holeNumber: number, genderFlight: string, availableTees?: string[]): string {
  // Single tee box — everyone uses it
  if (availableTees && availableTees.length === 1) return availableTees[0];

  if (isWomensFlight(genderFlight)) {
    if (!availableTees || availableTees.includes("Yellow")) return "Yellow";
    return availableTees[availableTees.length - 1];
  }

  // Men: White for front 9, Red for back 9
  if (!availableTees) return holeNumber <= 9 ? "White" : "Red";

  const preferredTee = holeNumber <= 9 ? "White" : "Red";
  if (availableTees.includes(preferredTee)) return preferredTee;

  // Fallback: first available tee
  return availableTees[0];
}

export function isWomensFlight(genderFlight: string): boolean {
  return genderFlight.toLowerCase().includes("women");
}

export function isMensFlight(genderFlight: string): boolean {
  return !isWomensFlight(genderFlight);
}
