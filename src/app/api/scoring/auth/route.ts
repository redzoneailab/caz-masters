import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TOURNAMENT } from "@/lib/tournament";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const { teamId, scorerName, pin, scorerKey: existingKey } = await req.json();

  if (!pin) {
    return NextResponse.json({ error: "PIN required" }, { status: 400 });
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

  // Validate universal PIN
  if (!tournament.scorerPin || tournament.scorerPin !== pin) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }

  // Resolve team: by teamId (legacy/cached sessions) or by scorer name lookup
  let team;
  if (teamId) {
    team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          select: { id: true, fullName: true, genderFlight: true },
          orderBy: { fullName: "asc" },
        },
      },
    });
    if (!team || team.tournamentId !== tournament.id) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
  } else if (scorerName) {
    // Look up player by name, find their team
    const player = await prisma.player.findFirst({
      where: {
        tournamentId: tournament.id,
        fullName: { equals: scorerName, mode: "insensitive" },
      },
      select: { teamId: true },
    });
    if (!player) {
      return NextResponse.json(
        { error: "No registration found for that name. Check your spelling or contact the tournament organizer." },
        { status: 404 }
      );
    }
    if (!player.teamId) {
      return NextResponse.json(
        { error: "You're not assigned to a team yet. Contact the tournament organizer." },
        { status: 400 }
      );
    }
    team = await prisma.team.findUnique({
      where: { id: player.teamId },
      include: {
        members: {
          select: { id: true, fullName: true, genderFlight: true },
          orderBy: { fullName: "asc" },
        },
      },
    });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
  } else {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  // Check scorer lock
  if (team.activeScorerKey) {
    // Allow resuming if the client has the matching key
    if (existingKey && existingKey === team.activeScorerKey) {
      // Resuming existing session — return data
    } else {
      return NextResponse.json(
        { error: `Scoring is already in progress for this team by ${team.activeScorerName || "another scorer"}.` },
        { status: 409 }
      );
    }
  }

  // Lock the team to this scorer (or keep existing lock on resume)
  const scorerKey = existingKey && existingKey === team.activeScorerKey
    ? existingKey
    : randomUUID();

  if (!team.activeScorerKey || scorerKey !== team.activeScorerKey) {
    await prisma.team.update({
      where: { id: teamId },
      data: {
        activeScorerName: scorerName || "Unknown",
        activeScorerKey: scorerKey,
      },
    });
  }

  const existingScores = await prisma.score.findMany({
    where: {
      tournamentId: tournament.id,
      playerId: { in: team.members.map((m) => m.id) },
    },
  });

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
  const teamStartingHole = shotgunStart ? (team.startingHole ?? 1) : 1;

  return NextResponse.json({
    scorerKey,
    team: { id: team.id, name: team.name, startingHole: teamStartingHole },
    players: team.members,
    holes,
    numHoles: tournament.numHoles,
    tournamentId: tournament.id,
    teeAssignments: tournament.teeAssignments ?? null,
    existingScores: existingScores.map((s) => ({
      playerId: s.playerId,
      holeNumber: s.holeNumber,
      strokes: s.strokes,
      shotgunBeer: s.shotgunBeer,
      rehit: s.rehit,
    })),
  });
}
