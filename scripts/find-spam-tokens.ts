// Read-only: list VerificationTokens that look like bot spam.
// Heuristic: gmail dot-trick (3+ dots in local-part), throwaway domains, very long random local-parts.

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const KNOWN_THROWAWAY_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "tempmail.com", "10minutemail.com",
  "trashmail.com", "yopmail.com", "fakeinbox.com", "throwawaymail.com",
  "getnada.com", "maildrop.cc", "sharklasers.com", "dispostable.com",
  "mintemail.com", "spambox.us", "tempr.email",
]);

function looksLikeSpamEmail(email: string): string | null {
  const e = email.toLowerCase().trim();
  const at = e.indexOf("@");
  if (at < 1) return "no @ sign";
  const local = e.slice(0, at);
  const domain = e.slice(at + 1);

  if (KNOWN_THROWAWAY_DOMAINS.has(domain)) return `throwaway domain (${domain})`;

  // gmail dot-trick: gmail/googlemail ignores dots in local-part. 3+ dots is wildly suspicious.
  if ((domain === "gmail.com" || domain === "googlemail.com") && (local.match(/\./g) || []).length >= 3) {
    return `gmail dot-trick (${(local.match(/\./g) || []).length} dots)`;
  }

  // Consecutive dots
  if (/\.\./.test(local)) return "consecutive dots in local-part";

  return null;
}

async function main() {
  const tokens = await prisma.verificationToken.findMany({
    orderBy: { expires: "desc" },
    select: { identifier: true, token: true, expires: true },
  });

  const spam: Array<{ identifier: string; reason: string; expires: Date }> = [];
  const clean: typeof tokens = [];

  for (const t of tokens) {
    const reason = looksLikeSpamEmail(t.identifier);
    if (reason) spam.push({ identifier: t.identifier, reason, expires: t.expires });
    else clean.push(t);
  }

  console.log(`\nTotal pending tokens: ${tokens.length}`);
  console.log(`Spam-looking:         ${spam.length}`);
  console.log(`Clean-looking:        ${clean.length}\n`);

  console.log("=== Spam-looking tokens (would be deleted) ===");
  for (const s of spam) {
    console.log(`${s.expires.toISOString().slice(0, 16)}  ${s.identifier.padEnd(55)} -> ${s.reason}`);
  }

  console.log(`\n=== Clean-looking tokens (kept) ===`);
  for (const c of clean) {
    console.log(`${c.expires.toISOString().slice(0, 16)}  ${c.identifier}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
