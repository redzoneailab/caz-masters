import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const entries = [
  // 2025
  { year: 2025, category: "mens_individual", winnerName: "Nick Petroff" },
  { year: 2025, category: "womens_individual", winnerName: "Casey Beauchamp" },
  { year: 2025, category: "senior_individual", winnerName: "Doug Falso" },
  { year: 2025, category: "team", winnerName: "Ben Romagnoli, Ryan Romagnoli, T.J. Connellan, Alex Krawec, Chadderdon" },

  // 2024
  { year: 2024, category: "mens_individual", winnerName: "Shane Franz" },
  { year: 2024, category: "womens_individual", winnerName: "Casey Beauchamp" },
  { year: 2024, category: "team", winnerName: "Mark Romagnoli, Greg Bakos, Ben Cotter, Peter Kellstrand, Dave Bouchard" },
  { year: 2024, category: "shotgun_champion", winnerName: "Dave Bouchard", score: 18, description: "18 shotguns" },

  // 2023
  { year: 2023, category: "mens_individual", winnerName: "Nick Christakos", score: 67 },
  { year: 2023, category: "womens_individual", winnerName: "Nicole Miller" },
  { year: 2023, category: "team", winnerName: "Shane Franz, Tyler Crawford, Torrey Krause, Mike Race", score: 117 },
  { year: 2023, category: "shotgun_champion", winnerName: "Bennett Cotter", score: 18, description: "18 shotguns" },

  // 2022
  { year: 2022, category: "mens_individual", winnerName: "Nick Velasco" },
  { year: 2022, category: "womens_individual", winnerName: "Casey Beauchamp" },
  { year: 2022, category: "team", winnerName: "Shane Franz, Tyler Crawford, Torey Krause, Cullen Franz" },
  { year: 2022, category: "shotgun_champion", winnerName: "Bennett Cotter", score: 18, description: "18 shotguns" },

  // 2021
  { year: 2021, category: "mens_individual", winnerName: "Nick Christakos", score: 70 },
  { year: 2021, category: "womens_individual", winnerName: "Casey Beauchamp" },
  { year: 2021, category: "team", winnerName: "Rob Glass, Pete Elliot, Jimmy Barnes, Matt Welch" },
  { year: 2021, category: "shotgun_champion", winnerName: "Bennett Cotter", score: 18, description: "18 shotguns" },

  // 2020 — COVID
  { year: 2020, category: "mens_individual", winnerName: "Nick Christakos", description: "COVID - Limited Event" },
  { year: 2020, category: "team", winnerName: "COVID - Limited Event", description: "COVID - Limited Event" },
  { year: 2020, category: "shotgun_champion", winnerName: "COVID - Limited Event", description: "COVID - Limited Event" },

  // 2019
  { year: 2019, category: "mens_individual", winnerName: "Nick Velasko", score: 68 },
  { year: 2019, category: "team", winnerName: "Sean Dougherty, Pat Dougherty, Nick Velasko, Brian Bartlett", score: 121 },
  { year: 2019, category: "shotgun_champion", winnerName: "Bennett Cotter", score: 18, description: "18 shotguns" },

  // 2018
  { year: 2018, category: "mens_individual", winnerName: "Greg Bakos", score: 69 },
  { year: 2018, category: "team", winnerName: "Greg Bakos, Bennett Cotter, Mike Race, Mark Romagnoli", score: 119 },
  { year: 2018, category: "shotgun_champion", winnerName: "Bennett Cotter", score: 18, description: "18 shotguns" },

  // 2017
  { year: 2017, category: "mens_individual", winnerName: "Nick Christakos", score: 69 },

  // 2014
  { year: 2014, category: "mens_individual", winnerName: "Jon Rainbow" },

  // 2013
  { year: 2013, category: "mens_individual", winnerName: "Shane Franz" },
  { year: 2013, category: "shotgun_champion", winnerName: "Danny Polsin" },

  // 2012
  { year: 2012, category: "mens_individual", winnerName: "Jon Rainbow" },
  { year: 2012, category: "shotgun_champion", winnerName: "Danny Polsin" },
];

async function main() {
  // Filter out any entries with empty winner names
  const valid = entries.filter((e) => e.winnerName.trim() !== "");

  console.log(`Seeding ${valid.length} Hall of Fame entries...`);

  let created = 0;
  let skipped = 0;

  for (const entry of valid) {
    try {
      await prisma.hallOfFameEntry.upsert({
        where: {
          year_category_winnerName: {
            year: entry.year,
            category: entry.category,
            winnerName: entry.winnerName,
          },
        },
        update: {
          score: entry.score ?? null,
          description: entry.description ?? null,
        },
        create: {
          year: entry.year,
          category: entry.category,
          winnerName: entry.winnerName,
          score: entry.score ?? null,
          description: entry.description ?? null,
        },
      });
      created++;
      console.log(`  ✓ ${entry.year} ${entry.category}: ${entry.winnerName}`);
    } catch (err) {
      console.error(`  ✗ ${entry.year} ${entry.category}: ${entry.winnerName}`, err);
      skipped++;
    }
  }

  console.log(`\nDone. ${created} upserted, ${skipped} failed.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
