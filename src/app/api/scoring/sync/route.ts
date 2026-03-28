import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Bulk sync offline scores
export async function POST(req: NextRequest) {
  const { teamId, scorerKey, scores } = await req.json();

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { activeScorerKey: true, tournamentId: true, members: { select: { id: true } } },
  });
  if (!team || team.activeScorerKey !== scorerKey) {
    return NextResponse.json({ error: "Invalid scorer credentials" }, { status: 401 });
  }

  const memberIds = new Set(team.members.map((m) => m.id));

  let synced = 0;
  for (const score of scores) {
    if (!memberIds.has(score.playerId)) continue;
    if (score.strokes < 1 || score.strokes > 20) continue;

    await prisma.score.upsert({
      where: {
        playerId_tournamentId_holeNumber: {
          playerId: score.playerId,
          tournamentId: team.tournamentId,
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
        tournamentId: team.tournamentId,
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
