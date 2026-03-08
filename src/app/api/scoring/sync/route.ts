import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Bulk sync offline scores
export async function POST(req: NextRequest) {
  const { scorerId, pin, scores } = await req.json();

  const scorerPin = await prisma.scorerPin.findFirst({
    where: { playerId: scorerId, pin },
    include: { player: { select: { teamId: true } } },
  });
  if (!scorerPin) {
    return NextResponse.json({ error: "Invalid scorer credentials" }, { status: 401 });
  }

  const teamMembers = await prisma.player.findMany({
    where: { teamId: scorerPin.player.teamId },
    select: { id: true },
  });
  const memberIds = new Set(teamMembers.map((m) => m.id));

  let synced = 0;
  for (const score of scores) {
    if (!memberIds.has(score.playerId)) continue;
    if (score.strokes < 1 || score.strokes > 20) continue;

    await prisma.score.upsert({
      where: {
        playerId_tournamentId_holeNumber: {
          playerId: score.playerId,
          tournamentId: scorerPin.tournamentId,
          holeNumber: score.holeNumber,
        },
      },
      update: {
        strokes: score.strokes,
        shotgunBeer: score.shotgunBeer || false,
        rehit: score.rehit || false,
      },
      create: {
        playerId: score.playerId,
        tournamentId: scorerPin.tournamentId,
        holeNumber: score.holeNumber,
        strokes: score.strokes,
        shotgunBeer: score.shotgunBeer || false,
        rehit: score.rehit || false,
      },
    });
    synced++;
  }

  return NextResponse.json({ synced });
}
