import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TOURNAMENT } from "@/lib/tournament";

export const revalidate = 60;

export async function GET() {
  const tournament = await prisma.tournament.findUnique({
    where: { year: TOURNAMENT.year },
  });

  if (!tournament) {
    return NextResponse.json({ count: 0 });
  }

  const count = await prisma.poll.count({
    where: { tournamentId: tournament.id, active: true },
  });

  return NextResponse.json({ count });
}
