import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TOURNAMENT } from "@/lib/tournament";

export async function POST(req: NextRequest) {
  const { fullName, pin } = await req.json();

  if (!fullName || !pin) {
    return NextResponse.json({ error: "Name and PIN required" }, { status: 400 });
  }

  const tournament = await prisma.tournament.findUnique({
    where: { year: TOURNAMENT.year },
    include: {
      course: {
        include: {
          holes: {
            where: { active: true },
            include: { teeBoxes: true },
            orderBy: { holeNumber: "asc" },
          },
        },
      },
    },
  });
  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  const player = await prisma.player.findFirst({
    where: {
      tournamentId: tournament.id,
      fullName: { equals: fullName, mode: "insensitive" },
    },
    include: { scorerPin: true },
  });

  if (!player || !player.scorerPin || player.scorerPin.pin !== pin) {
    return NextResponse.json({ error: "Invalid name or PIN" }, { status: 401 });
  }

  if (!player.teamId) {
    return NextResponse.json({ error: "You must be on a team to score" }, { status: 400 });
  }

  const team = await prisma.team.findUnique({
    where: { id: player.teamId },
    include: {
      members: {
        select: { id: true, fullName: true, genderFlight: true },
        orderBy: { fullName: "asc" },
      },
    },
  });

  const existingScores = await prisma.score.findMany({
    where: {
      tournamentId: tournament.id,
      playerId: { in: team?.members.map((m) => m.id) || [] },
    },
  });

  // Filter holes to numHoles and include tee box data
  const holes = (tournament.course?.holes || [])
    .filter((h) => h.holeNumber <= tournament.numHoles)
    .map((h) => ({
      holeNumber: h.holeNumber,
      teeBoxes: (h.teeBoxes || []).map((t) => ({
        name: t.name,
        par: t.par,
        yardage: t.yardage,
      })),
    }));

  const shotgunStart = tournament.shotgunStart ?? true;
  const teamStartingHole = shotgunStart ? (team?.startingHole ?? 1) : 1;

  return NextResponse.json({
    scorer: { id: player.id, name: player.fullName },
    team: { id: team?.id, name: team?.name, startingHole: teamStartingHole },
    players: team?.members || [],
    holes,
    numHoles: tournament.numHoles,
    tournamentId: tournament.id,
    existingScores: existingScores.map((s) => ({
      playerId: s.playerId,
      holeNumber: s.holeNumber,
      strokes: s.strokes,
      shotgunBeer: s.shotgunBeer,
      rehit: s.rehit,
    })),
  });
}
