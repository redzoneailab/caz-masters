import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TOURNAMENT } from "@/lib/tournament";

// Public endpoint: list teams for the scoring team picker
export async function GET() {
  const tournament = await prisma.tournament.findUnique({
    where: { year: TOURNAMENT.year },
  });
  if (!tournament) {
    return NextResponse.json({ teams: [] });
  }

  const teams = await prisma.team.findMany({
    where: { tournamentId: tournament.id },
    select: {
      id: true,
      name: true,
      activeScorerName: true,
      members: {
        select: { fullName: true },
        orderBy: { fullName: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    teams: teams.map((t) => ({
      id: t.id,
      name: t.name,
      activeScorerName: t.activeScorerName,
      memberNames: t.members.map((m) => m.fullName),
    })),
  });
}
