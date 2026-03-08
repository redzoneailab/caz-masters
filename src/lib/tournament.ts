export const TOURNAMENT = {
  name: "The Caz Masters",
  year: 2026,
  edition: "15th Annual",
  date: new Date("2026-07-03T08:00:00-04:00"), // July 4th weekend
  dateDisplay: "July 4th Weekend, 2026",
  location: "Cazenovia Golf Club",
  maxPlayers: 72,
  entryFee: 150, // dollars
  entryFeeCents: 15000,
  shotgunBeerPrice: 5, // dollars per beer
  numHoles: 9,
} as const;
