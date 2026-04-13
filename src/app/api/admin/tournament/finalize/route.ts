import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TOURNAMENT } from "@/lib/tournament";
import { getTeeBoxName, isMensFlight, TeeAssignments } from "@/lib/tees";

function checkAuth(req: NextRequest) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

function stablefordPoints(strokes: number, par: number): number {
  const diff = strokes - par;
  if (diff <= -3) return 5;
  if (diff === -2) return 4;
  if (diff === -1) return 3;
  if (diff === 0) return 2;
  if (diff === 1) return 1;
  return 0;
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { confirm } = await req.json();
  if (confirm !== "FINALIZE") {
    return NextResponse.json({ error: "Confirmation required: send { confirm: \"FINALIZE\" }" }, { status: 400 });
  }

  const tournament = await prisma.tournament.findUnique({
    where: { year: TOURNAMENT.year },
    include: {
      course: {
        include: {
          holes: {
            where: { active: true },
            include: { teeBoxes: true },
          },
        },
      },
      teams: {
        include: {
          members: { select: { id: true, fullName: true, genderFlight: true } },
        },
      },
    },
  });

  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  if (tournament.finalized) {
    return NextResponse.json({ error: "Tournament is already finalized" }, { status: 400 });
  }

  const year = tournament.year;
  const numHoles = tournament.numHoles;

  // ── Build par lookup ──
  const courseHoles = tournament.course?.holes || [];
  const teeMap = new Map<number, Map<string, number>>();
  for (const hole of courseHoles) {
    const tees = new Map<string, number>();
    for (const tb of hole.teeBoxes) tees.set(tb.name, tb.par);
    teeMap.set(hole.holeNumber, tees);
  }
  const teeAssignments = (tournament.teeAssignments as TeeAssignments | null) ?? null;

  function getParForPlayer(holeNumber: number, genderFlight: string): number {
    const holeTees = teeMap.get(holeNumber);
    const availableTees = holeTees ? Array.from(holeTees.keys()) : undefined;
    const teeName = getTeeBoxName(holeNumber, genderFlight, availableTees, teeAssignments);
    return holeTees?.get(teeName) || 4;
  }

  // ── Calculate standings ──
  const scores = await prisma.score.findMany({
    where: { tournamentId: tournament.id },
    include: { player: { select: { id: true, fullName: true, genderFlight: true, teamId: true, team: { select: { name: true } } } } },
  });

  const byPlayer = new Map<string, typeof scores>();
  for (const s of scores) {
    const arr = byPlayer.get(s.playerId) || [];
    arr.push(s);
    byPlayer.set(s.playerId, arr);
  }

  const standings = Array.from(byPlayer.entries()).map(([, playerScores]) => {
    const player = playerScores[0].player;
    const totalStrokes = playerScores.reduce((s, sc) => s + sc.strokes, 0);
    const totalPar = playerScores.reduce((s, sc) => s + getParForPlayer(sc.holeNumber, player.genderFlight), 0);
    const beers = playerScores.filter((s) => s.shotgunBeer).length;
    return {
      name: player.fullName,
      flight: player.genderFlight,
      teamName: player.team?.name || "",
      toPar: totalStrokes - totalPar,
      totalStrokes,
      holesCompleted: playerScores.length,
      beers,
    };
  });

  const formatScore = (toPar: number, strokes: number) => {
    const toParStr = toPar < 0 ? `${toPar}` : toPar === 0 ? "E" : `+${toPar}`;
    return `${toParStr} (${strokes})`;
  };

  // ── Auto-populate Hall of Fame ──
  const hofEntries: { category: string; winnerName: string; teamName?: string; description?: string; score?: number }[] = [];

  // Men's champion
  const mensComplete = standings
    .filter((s) => isMensFlight(s.flight) && s.holesCompleted >= numHoles)
    .sort((a, b) => a.toPar - b.toPar);
  if (mensComplete.length > 0) {
    hofEntries.push({
      category: "mens_individual",
      winnerName: mensComplete[0].name,
      teamName: mensComplete[0].teamName,
      description: formatScore(mensComplete[0].toPar, mensComplete[0].totalStrokes),
      score: mensComplete[0].totalStrokes,
    });
  }

  // Women's champion
  const womensComplete = standings
    .filter((s) => !isMensFlight(s.flight) && s.holesCompleted >= numHoles)
    .sort((a, b) => a.toPar - b.toPar);
  if (womensComplete.length > 0) {
    hofEntries.push({
      category: "womens_individual",
      winnerName: womensComplete[0].name,
      teamName: womensComplete[0].teamName,
      description: formatScore(womensComplete[0].toPar, womensComplete[0].totalStrokes),
      score: womensComplete[0].totalStrokes,
    });
  }

  // Team Stableford winner
  const teamResults = tournament.teams.map((team) => {
    let totalPoints = 0;
    for (const hole of courseHoles) {
      if (hole.holeNumber > numHoles) continue;
      const holePoints = team.members
        .map((m) => {
          const memberScores = byPlayer.get(m.id) || [];
          const score = memberScores.find((s) => s.holeNumber === hole.holeNumber);
          if (!score) return null;
          return stablefordPoints(score.strokes, getParForPlayer(hole.holeNumber, m.genderFlight));
        })
        .filter((p): p is number => p !== null);

      if (holePoints.length === 0) continue;
      const points = [...holePoints];
      if (points.length === 5) {
        points.sort((a, b) => a - b);
        points.splice(2, 1);
      }
      totalPoints += points.reduce((s, p) => s + p, 0);
    }
    return { name: team.name, points: totalPoints };
  }).sort((a, b) => b.points - a.points);

  if (teamResults.length > 0 && teamResults[0].points > 0) {
    hofEntries.push({
      category: "team",
      winnerName: teamResults[0].name,
      description: `${teamResults[0].points} Stableford points`,
      score: teamResults[0].points,
    });
  }

  // Shotgun champion
  const shotgunLeader = standings.filter((s) => s.beers > 0).sort((a, b) => b.beers - a.beers);
  if (shotgunLeader.length > 0) {
    hofEntries.push({
      category: "shotgun_champion",
      winnerName: shotgunLeader[0].name,
      teamName: shotgunLeader[0].teamName,
      description: `${shotgunLeader[0].beers} shotgun${shotgunLeader[0].beers !== 1 ? "s" : ""}`,
      score: shotgunLeader[0].beers,
    });
  }

  // Write HoF entries (upsert to avoid duplicates)
  for (const entry of hofEntries) {
    await prisma.hallOfFameEntry.upsert({
      where: {
        year_category_winnerName: {
          year,
          category: entry.category,
          winnerName: entry.winnerName,
        },
      },
      update: {
        teamName: entry.teamName || null,
        description: entry.description || null,
        score: entry.score ?? null,
      },
      create: {
        year,
        category: entry.category,
        winnerName: entry.winnerName,
        teamName: entry.teamName || null,
        description: entry.description || null,
        score: entry.score ?? null,
      },
    });
  }

  // ── Also write finalized fan_vote poll winners ──
  const finalizedPolls = await prisma.poll.findMany({
    where: { tournamentId: tournament.id, finalized: true },
    include: {
      options: {
        include: { _count: { select: { votes: true } } },
      },
    },
  });

  for (const poll of finalizedPolls) {
    const sorted = [...poll.options].sort((a, b) => b._count.votes - a._count.votes);
    if (sorted.length > 0 && sorted[0]._count.votes > 0) {
      await prisma.hallOfFameEntry.upsert({
        where: {
          year_category_winnerName: {
            year,
            category: "fan_vote",
            winnerName: sorted[0].label,
          },
        },
        update: { description: poll.title },
        create: {
          year,
          category: "fan_vote",
          winnerName: sorted[0].label,
          description: poll.title,
        },
      });
    }
  }

  // ── Lock everything ──
  await prisma.tournament.update({
    where: { id: tournament.id },
    data: {
      finalized: true,
      registrationOpen: false,
      teamsLocked: true,
    },
  });

  // Close all active polls
  await prisma.poll.updateMany({
    where: { tournamentId: tournament.id, active: true },
    data: { active: false },
  });

  // Clear all scorer locks
  await prisma.team.updateMany({
    where: { tournamentId: tournament.id },
    data: { activeScorerName: null, activeScorerKey: null },
  });

  // ── Create next year's tournament ──
  const nextYear = year + 1;
  const existingNext = await prisma.tournament.findUnique({ where: { year: nextYear } });
  if (!existingNext) {
    await prisma.tournament.create({
      data: {
        name: TOURNAMENT.name,
        year: nextYear,
        date: new Date(`${nextYear}-07-03T08:00:00-04:00`),
        location: tournament.location,
        maxPlayers: tournament.maxPlayers,
        entryFee: tournament.entryFee,
        numHoles: tournament.numHoles,
        shotgunStart: tournament.shotgunStart,
        courseId: tournament.courseId,
      },
    });
  }

  return NextResponse.json({
    success: true,
    hofEntries: hofEntries.length,
    message: `Tournament finalized. ${hofEntries.length} Hall of Fame entries created. ${nextYear} tournament record created.`,
  });
}
