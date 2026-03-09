import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TOURNAMENT } from "@/lib/tournament";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ found: false });
  }

  const player = await prisma.player.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      tournament: { year: TOURNAMENT.year },
    },
    select: { fullName: true },
  });

  return NextResponse.json({
    found: !!player,
    name: player?.fullName || undefined,
  });
}
