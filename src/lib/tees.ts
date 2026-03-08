/**
 * Determines which tee box a player plays from based on their flight and hole number.
 *
 * Cazenovia Golf Club is a 9-hole course played as 18:
 * - Holes 1-9: Men play White tees, Women play Yellow tees
 * - Holes 10-18: Men play Red tees, Women play Yellow tees
 */
export function getTeeBoxName(holeNumber: number, genderFlight: string): string {
  if (isWomensFlight(genderFlight)) return "Yellow";
  return holeNumber <= 9 ? "White" : "Red";
}

export function isWomensFlight(genderFlight: string): boolean {
  return genderFlight.toLowerCase().includes("women");
}

export function isMensFlight(genderFlight: string): boolean {
  return !isWomensFlight(genderFlight);
}
