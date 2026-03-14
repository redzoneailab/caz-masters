export const TOURNAMENT = {
  name: "The Caz Masters",
  year: 2026,
  edition: "15th Annual",
  date: new Date("2026-07-03T08:00:00-04:00"),
  dateDisplay: "Friday, July 3rd, 2026",
  location: "Cazenovia Golf Club",
  maxPlayers: 72,
  entryFee: 150, // dollars
  entryFeeCents: 15000,
  shotgunBeerPrice: 5, // dollars per beer
  numHoles: 9,
  afterPartyPrice: 25, // dollars per person
  afterPartyPriceCents: 2500,
  afterPartyVenue: "The Brae Loch Inn",
  afterPartyTime: "Around 3:00 PM",
  afterPartyDate: "July 3rd, 2026",
  afterPartyIncludes: [
    "Buffet",
    "Awards ceremony",
  ],
} as const;
