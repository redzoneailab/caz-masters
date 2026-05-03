// Deletes pending VerificationTokens. DESTRUCTIVE.
// Modes:
//   (default)        — dry-run: counts tokens
//   --confirm        — delete everything in VerificationToken table
//
// Use after enabling rate limiting on /api/auth/signin to clear the existing spam backlog.

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const confirm = process.argv.includes("--confirm");
  const total = await prisma.verificationToken.count();

  console.log(`Pending VerificationTokens: ${total}`);

  if (!confirm) {
    console.log("Dry run — pass --confirm to delete all of them.");
    return;
  }

  const result = await prisma.verificationToken.deleteMany({});
  console.log(`Deleted ${result.count} tokens.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
