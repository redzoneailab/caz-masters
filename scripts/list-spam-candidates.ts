// One-off: list registrations that look like bot spam.
// Heuristics: gibberish local-part (high consonant ratio / random-looking), throwaway domains,
// suspicious names, and other tell-tale patterns. Read-only — prints only.

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

function isGibberish(s: string) {
  const letters = s.toLowerCase().replace(/[^a-z]/g, "");
  if (letters.length < 6) return false;
  const vowels = (letters.match(/[aeiouy]/g) || []).length;
  const vowelRatio = vowels / letters.length;
  if (vowelRatio < 0.18 || vowelRatio > 0.65) return true;
  if (/[bcdfghjklmnpqrstvwxz]{5,}/.test(letters)) return true;
  if (/[aeiouy]{4,}/.test(letters)) return true;
  if (/\d{4,}/.test(s) && /[a-z]{4,}/i.test(s)) return true;
  return false;
}

function nameLikelyFake(fullName: string | null | undefined) {
  if (!fullName) return true;
  const trimmed = fullName.trim();
  if (trimmed.length < 3) return true;
  if (!/\s/.test(trimmed)) return true;
  if (/[0-9]/.test(trimmed)) return true;
  if (/(.)\1{4,}/.test(trimmed)) return true;
  if (isGibberish(trimmed.replace(/\s+/g, ""))) return true;
  return false;
}

function phoneLooksBogus(phone: string | null | undefined) {
  if (!phone) return true;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return true;
  if (/^(\d)\1+$/.test(digits)) return true;
  if (digits === "1234567890") return true;
  return false;
}

function scoreSpam(p: { fullName: string; email: string; phone: string }) {
  const reasons: string[] = [];
  const email = (p.email || "").toLowerCase().trim();
  const [local, domain] = email.split("@");

  if (!local || !domain) reasons.push("malformed email");
  if (domain && KNOWN_THROWAWAY_DOMAINS.has(domain)) reasons.push(`throwaway domain (${domain})`);
  if (local && isGibberish(local)) reasons.push("gibberish local-part");
  if (nameLikelyFake(p.fullName)) reasons.push("suspicious name");
  if (phoneLooksBogus(p.phone)) reasons.push("bogus phone");

  return reasons;
}

async function main() {
  const players = await prisma.player.findMany({
    select: { id: true, fullName: true, email: true, phone: true, createdAt: true, flaggedAsSpam: true, payment: { select: { status: true } } },
    orderBy: { createdAt: "desc" },
  });

  const candidates: Array<typeof players[number] & { reasons: string[] }> = [];
  for (const p of players) {
    const reasons = scoreSpam(p);
    if (reasons.length >= 2) {
      candidates.push({ ...p, reasons });
    }
  }

  console.log(`\nTotal players in DB: ${players.length}`);
  console.log(`Likely spam candidates (>=2 heuristic hits): ${candidates.length}\n`);
  console.log("ID                          | Name                 | Email                                | Phone            | Created           | Flagged | Reasons");
  console.log("-".repeat(170));
  for (const c of candidates) {
    const created = c.createdAt.toISOString().slice(0, 16).replace("T", " ");
    console.log(
      `${c.id.padEnd(28)}| ${(c.fullName || "").slice(0, 20).padEnd(21)}| ${(c.email || "").slice(0, 37).padEnd(38)}| ${(c.phone || "").slice(0, 16).padEnd(17)}| ${created} | ${c.flaggedAsSpam ? "yes    " : "no     "} | ${c.reasons.join("; ")}`
    );
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
