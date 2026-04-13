import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TOURNAMENT } from "@/lib/tournament";
import { getTeeBoxName, isMensFlight, TeeAssignments } from "@/lib/tees";

function stablefordPoints(strokes: number, par: number): number {
  const diff = strokes - par;
  if (diff <= -3) return 5; // Albatross or better
  if (diff === -2) return 4; // Eagle
  if (diff === -1) return 3; // Birdie
  if (diff === 0) return 2;  // Par
  if (diff === 1) return 1;  // Bogey
  return 0; // Double bogey+
}

function getCurrentHole(startingHole: number, holesCompleted: number, numHoles: number): number | null {
  if (holesCompleted >= numHoles) return null;
  return ((startingHole - 1 + holesCompleted) % numHoles) + 1;
}

const EMPTY = { mens: [], womens: [], teamStableford: [], shotgunChampion: [], holes: [], numHoles: 0, finalized: false };

export async function GET() {
  try {
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
    if (!tournament?.course) {
      return NextResponse.json(EMPTY);
    }

  const numHoles = tournament.numHoles;
  const shotgunStart = tournament.shotgunStart ?? true;
  const teeAssignments = (tournament.teeAssignments as TeeAssignments | null) ?? null;
  const holes = tournament.course.holes.filter((h) => h.holeNumber <= numHoles);

  // Build tee box lookup: holeNumber -> teeName -> { par, yardage }
  const teeMap = new Map<number, Map<string, { par: number; yardage: number | null }>>();
  for (const hole of holes) {
    const tees = new Map<string, { par: number; yardage: number | null }>();
    for (const tb of hole.teeBoxes) {
      tees.set(tb.name, { par: tb.par, yardage: tb.yardage });
    }
    teeMap.set(hole.holeNumber, tees);
  }

  function getParForPlayer(holeNumber: number, genderFlight: string): number {
    const holeTees = teeMap.get(holeNumber);
    const availableTees = holeTees ? Array.from(holeTees.keys()) : undefined;
    const teeName = getTeeBoxName(holeNumber, genderFlight, availableTees, teeAssignments);
    return holeTees?.get(teeName)?.par || 4;
  }

  // Get all scores + player data (include team for startingHole)
  const scores = await prisma.score.findMany({
    where: { tournamentId: tournament.id },
    include: {
      player: {
        select: {
          id: true, fullName: true, genderFlight: true, teamId: true,
          team: { select: { id: true, name: true, startingHole: true } },
        },
      },
    },
  });

  // Group scores by player
  const byPlayer = new Map<string, typeof scores>();
  for (const s of scores) {
    const arr = byPlayer.get(s.playerId) || [];
    arr.push(s);
    byPlayer.set(s.playerId, arr);
  }

  // Build individual leaderboard
  const individuals: {
    playerId: string;
    name: string;
    flight: string;
    teamName: string;
    totalStrokes: number;
    toPar: number;
    holesCompleted: number;
    thru: number;
    finished: boolean;
    currentHole: number | null;
    beerCount: number;
    scoresByHole: Record<number, { strokes: number; par: number; shotgunBeer: boolean; rehit: boolean }>;
  }[] = [];

  for (const [playerId, playerScores] of byPlayer) {
    const player = playerScores[0].player;
    const totalStrokes = playerScores.reduce((s, sc) => s + sc.strokes, 0);
    const holesCompleted = playerScores.length;
    const parForCompleted = playerScores.reduce(
      (s, sc) => s + getParForPlayer(sc.holeNumber, player.genderFlight),
      0
    );
    const beerCount = playerScores.filter((s) => s.shotgunBeer).length;
    const startingHole = shotgunStart ? (player.team?.startingHole ?? 1) : 1;
    const finished = holesCompleted >= numHoles;

    const scoresByHole: Record<number, { strokes: number; par: number; shotgunBeer: boolean; rehit: boolean }> = {};
    for (const s of playerScores) {
      const par = getParForPlayer(s.holeNumber, player.genderFlight);
      scoresByHole[s.holeNumber] = { strokes: s.strokes, par, shotgunBeer: s.shotgunBeer, rehit: s.rehit };
    }

    individuals.push({
      playerId,
      name: player.fullName,
      flight: player.genderFlight,
      teamName: player.team?.name || "",
      totalStrokes,
      toPar: totalStrokes - parForCompleted,
      holesCompleted,
      thru: holesCompleted,
      finished,
      currentHole: getCurrentHole(startingHole, holesCompleted, numHoles),
      beerCount,
      scoresByHole,
    });
  }

  // PGA-style sort: by toPar, finished first at same score, then holesCompleted desc
  const pgaSort = (a: typeof individuals[0], b: typeof individuals[0]) => {
    if (a.toPar !== b.toPar) return a.toPar - b.toPar;
    if (a.finished !== b.finished) return a.finished ? -1 : 1;
    return b.holesCompleted - a.holesCompleted;
  };

  const mens = individuals.filter((p) => isMensFlight(p.flight)).sort(pgaSort);
  const womens = individuals.filter((p) => !isMensFlight(p.flight)).sort(pgaSort);

  // Team Stableford
  const teams = await prisma.team.findMany({
    where: { tournamentId: tournament.id },
    include: { members: { select: { id: true, fullName: true, genderFlight: true } } },
  });

  const teamStableford = teams.map((team) => {
    let totalPoints = 0;
    let holesCompleted = 0;
    const memberScores: Record<string, Record<number, typeof scores[0]>> = {};

    for (const member of team.members) {
      memberScores[member.id] = {};
      const ps = byPlayer.get(member.id) || [];
      for (const s of ps) {
        memberScores[member.id][s.holeNumber] = s;
      }
    }

    for (const hole of holes) {
      const holeEntries = team.members
        .map((m) => {
          const score = memberScores[m.id]?.[hole.holeNumber];
          if (!score) return null;
          const par = getParForPlayer(hole.holeNumber, m.genderFlight);
          return { score, par, genderFlight: m.genderFlight };
        })
        .filter(Boolean) as { score: typeof scores[0]; par: number; genderFlight: string }[];

      if (holeEntries.length === 0) continue;
      holesCompleted++;

      let points = holeEntries.map((e) => stablefordPoints(e.score.strokes, e.par));

      if (points.length === 5) {
        points.sort((a, b) => a - b);
        points.splice(2, 1);
      }

      totalPoints += points.reduce((s, p) => s + p, 0);
    }

    const startingHole = shotgunStart ? (team.startingHole ?? 1) : 1;
    const finished = holesCompleted >= numHoles;

    return {
      teamId: team.id,
      name: team.name,
      totalPoints,
      holesCompleted,
      thru: holesCompleted,
      finished,
      currentHole: getCurrentHole(startingHole, holesCompleted, numHoles),
      members: team.members.map((m) => ({
        id: m.id,
        name: m.fullName,
        scores: byPlayer.get(m.id)?.map((s) => ({
          holeNumber: s.holeNumber,
          strokes: s.strokes,
          stableford: stablefordPoints(s.strokes, getParForPlayer(s.holeNumber, m.genderFlight)),
        })) || [],
      })),
    };
  }).sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (a.finished !== b.finished) return a.finished ? -1 : 1;
    return b.holesCompleted - a.holesCompleted;
  });

  // Shotgun champion
  const shotgunChampion = individuals
    .filter((p) => p.beerCount > 0)
    .sort((a, b) => b.beerCount - a.beerCount)
    .map((p) => ({
      playerId: p.playerId,
      name: p.name,
      teamName: p.teamName,
      beerCount: p.beerCount,
      totalOwed: p.beerCount * TOURNAMENT.shotgunBeerPrice,
    }));

  const holesResponse = holes.map((h) => ({
    holeNumber: h.holeNumber,
    teeBoxes: h.teeBoxes.map((t) => ({ name: t.name, par: t.par, yardage: t.yardage })),
  }));

  return NextResponse.json({
    mens,
    womens,
    teamStableford,
    shotgunChampion,
    holes: holesResponse,
    numHoles,
    finalized: tournament.finalized,
  });
  } catch (e) {
    console.error("Leaderboard API error:", e);
    return NextResponse.json(EMPTY);
  }
}
