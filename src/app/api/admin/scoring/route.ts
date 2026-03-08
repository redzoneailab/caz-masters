import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TOURNAMENT } from "@/lib/tournament";

function checkAuth(req: NextRequest) {
  return req.headers.get("authorization") === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tournament = await prisma.tournament.findUnique({
    where: { year: TOURNAMENT.year },
  });
  if (!tournament) {
    return NextResponse.json({ scores: [], beerTab: [] });
  }

  const scores = await prisma.score.findMany({
    where: { tournamentId: tournament.id },
    include: {
      player: {
        select: { id: true, fullName: true, genderFlight: true, team: { select: { name: true } } },
      },
    },
    orderBy: [{ player: { fullName: "asc" } }, { holeNumber: "asc" }],
  });

  // Beer tab
  const beerScores = scores.filter((s) => s.shotgunBeer);
  const beerByPlayer = new Map<string, { name: string; team: string; count: number }>();
  for (const s of beerScores) {
    const existing = beerByPlayer.get(s.playerId);
    if (existing) {
      existing.count++;
    } else {
      beerByPlayer.set(s.playerId, {
        name: s.player.fullName,
        team: s.player.team?.name || "",
        count: 1,
      });
    }
  }

  const beerTab = Array.from(beerByPlayer.entries())
    .map(([playerId, data]) => ({
      playerId,
      ...data,
      totalOwed: data.count * TOURNAMENT.shotgunBeerPrice,
    }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({ scores, beerTab, tournamentId: tournament.id });
}
