import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Save/update scores for a hole
export async function POST(req: NextRequest) {
  const { teamId, scorerKey, scores } = await req.json();

  // Validate scorer via team lock
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { activeScorerKey: true, tournamentId: true, members: { select: { id: true } }, tournament: { select: { finalized: true } } },
  });
  if (!team || team.activeScorerKey !== scorerKey) {
    return NextResponse.json({ error: "Invalid scorer credentials" }, { status: 401 });
  }
  if (team.tournament.finalized) {
    return NextResponse.json({ error: "Tournament has been finalized. Scoring is locked." }, { status: 400 });
  }

  const memberIds = new Set(team.members.map((m) => m.id));

  const results = [];
  for (const score of scores) {
    if (!memberIds.has(score.playerId)) continue;
    if (score.strokes < 1 || score.strokes > 20) continue;

    const result = await prisma.score.upsert({
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
    results.push(result);
  }

  return NextResponse.json({ saved: results.length });
}
