import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const since = new Date(Date.now() - windowSeconds * 1000);

  const count = await prisma.rateLimitAttempt.count({
    where: { key, createdAt: { gte: since } },
  });

  if (count >= limit) {
    const oldest = await prisma.rateLimitAttempt.findFirst({
      where: { key, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });
    const retryAfterSeconds = oldest
      ? Math.max(1, Math.ceil((oldest.createdAt.getTime() + windowSeconds * 1000 - Date.now()) / 1000))
      : windowSeconds;
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  await prisma.rateLimitAttempt.create({ data: { key } });

  // Best-effort cleanup of stale rows for this key (1% of requests)
  if (Math.random() < 0.01) {
    await prisma.rateLimitAttempt
      .deleteMany({ where: { key, createdAt: { lt: since } } })
      .catch(() => {});
  }

  return { allowed: true, remaining: limit - count - 1, retryAfterSeconds: 0 };
}
