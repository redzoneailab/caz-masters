import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TOURNAMENT } from "@/lib/tournament";

// Public endpoint: list players eligible to score (registered, non-waitlisted,
// and assigned to a team) for the scoring name picker.
export async function GET() {
  const tournament = await prisma.tournament.findUnique({
    where: { year: TOURNAMENT.year },
  });
  if (!tournament) {
    return NextResponse.json({ players: [] });
  }

  const players = await prisma.player.findMany({
    where: {
      tournamentId: tournament.id,
      waitlisted: false,
      teamId: { not: null },
    },
    select: {
      fullName: true,
      team: { select: { name: true } },
    },
    orderBy: { fullName: "asc" },
  });

  return NextResponse.json({
    players: players.map((p) => ({
      fullName: p.fullName,
      teamName: p.team?.name ?? null,
    })),
  });
}
