// Read-only audit: shows recent players, recent UserAccounts, and pending VerificationTokens
// to help identify the spam vector.

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const playerCount = await prisma.player.count();
  const accountCount = await prisma.userAccount.count();
  const tokenCount = await prisma.verificationToken.count();

  console.log(`\n=== Counts ===`);
  console.log(`Players:           ${playerCount}`);
  console.log(`UserAccounts:      ${accountCount}`);
  console.log(`VerificationTokens (pending magic links): ${tokenCount}`);

  console.log(`\n=== 20 most recent Players ===`);
  const recentPlayers = await prisma.player.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, fullName: true, email: true, phone: true, createdAt: true },
  });
  for (const p of recentPlayers) {
    console.log(
      `${p.createdAt.toISOString().slice(0, 16)}  ${(p.fullName || "").padEnd(25)} ${(p.email || "").padEnd(40)} ${p.phone || ""}`
    );
  }

  console.log(`\n=== 20 most recent UserAccounts ===`);
  const recentAccounts = await prisma.userAccount.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { email: true, name: true, googleId: true, createdAt: true },
  });
  for (const a of recentAccounts) {
    console.log(
      `${a.createdAt.toISOString().slice(0, 16)}  ${(a.name || "").padEnd(25)} ${(a.email || "").padEnd(40)} google=${a.googleId ? "yes" : "no"}`
    );
  }

  console.log(`\n=== Pending VerificationTokens (magic links awaiting click) ===`);
  const tokens = await prisma.verificationToken.findMany({
    orderBy: { expires: "desc" },
    take: 20,
    select: { identifier: true, expires: true },
  });
  for (const t of tokens) {
    console.log(`${t.expires.toISOString().slice(0, 16)}  ${t.identifier}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
