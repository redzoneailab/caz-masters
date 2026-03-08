import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Save/update a single score
export async function POST(req: NextRequest) {
  const { scorerId, pin, scores } = await req.json();

  // Validate scorer
  const scorerPin = await prisma.scorerPin.findFirst({
    where: { playerId: scorerId, pin },
    include: { player: { select: { teamId: true } } },
  });
  if (!scorerPin) {
    return NextResponse.json({ error: "Invalid scorer credentials" }, { status: 401 });
  }

  // Get team members to validate player IDs
  const teamMembers = await prisma.player.findMany({
    where: { teamId: scorerPin.player.teamId },
    select: { id: true },
  });
  const memberIds = new Set(teamMembers.map((m) => m.id));

  // Upsert each score
  const results = [];
  for (const score of scores) {
    if (!memberIds.has(score.playerId)) continue;
    if (score.strokes < 1 || score.strokes > 20) continue;

    const result = await prisma.score.upsert({
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
    results.push(result);
  }

  return NextResponse.json({ saved: results.length });
}
