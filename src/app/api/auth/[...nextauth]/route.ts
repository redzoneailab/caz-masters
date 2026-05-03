import NextAuth from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const handler = NextAuth(authOptions);

export const GET = handler;

export async function POST(req: NextRequest, ctx: { params: Promise<{ nextauth: string[] }> }) {
  const { nextauth } = await ctx.params;
  const action = nextauth?.[0];

  // Rate limit sign-in attempts (5 per IP per hour). Magic-link email triggers an outbound send,
  // so this is the main spam vector. Also covers OAuth/credentials signin POSTs.
  if (action === "signin" || action === "callback") {
    const provider = nextauth?.[1] || "default";
    const ip = getClientIp(req);
    const rl = await checkRateLimit(`auth:${action}:${provider}:${ip}`, 5, 3600);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many sign-in attempts. Try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }
  }

  return handler(req, ctx);
}
