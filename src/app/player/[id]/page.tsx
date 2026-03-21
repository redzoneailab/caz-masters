import { prisma } from "@/lib/prisma";
import { getTeeBoxName, TeeAssignments } from "@/lib/tees";
import { notFound } from "next/navigation";
import PlayerProfile from "./PlayerProfile";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Try UserAccount first, then Player
  const account = await prisma.userAccount.findUnique({ where: { id }, select: { name: true } });
  if (account) return { title: `${account.name} | The Caz Masters` };
  const player = await prisma.player.findUnique({ where: { id }, select: { fullName: true } });
  return { title: player ? `${player.fullName} | The Caz Masters` : "Player Not Found" };
}

interface TournamentResult {
  year: number;
  flight: string;
  teamName: string;
  totalStrokes: number;
  toPar: number;
  holesPlayed: number;
  beers: number;
  paymentStatus: string;
  scores: { holeNumber: number; strokes: number; par: number; shotgunBeer: boolean; rehit: boolean }[];
}

export default async function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Try to find by UserAccount ID first
  let playerRecords = await getPlayersByAccountId(id);

  // If not found, try Player ID directly
  if (!playerRecords) {
    playerRecords = await getPlayersByPlayerId(id);
  }

  if (!playerRecords) notFound();

  const { name, avatarUrl, bio, players } = playerRecords;

  // Build tournament results
  const tournamentResults: TournamentResult[] = [];

  for (const player of players) {
    const courseHoles = player.tournament.course?.holes || [];
    const teeMap = new Map<number, Map<string, number>>();
    for (const hole of courseHoles) {
      const tees = new Map<string, number>();
      for (const tb of hole.teeBoxes) tees.set(tb.name, tb.par);
      teeMap.set(hole.holeNumber, tees);
    }

    const teeAssignments = (player.tournament.teeAssignments as TeeAssignments | null) ?? null;

    function getParForHole(holeNumber: number, genderFlight: string): number {
      const holeTees = teeMap.get(holeNumber);
      const availableTees = holeTees ? Array.from(holeTees.keys()) : undefined;
      const teeName = getTeeBoxName(holeNumber, genderFlight, availableTees, teeAssignments);
      return holeTees?.get(teeName) || 4;
    }

    const scores = player.scores.map((s) => ({
      holeNumber: s.holeNumber,
      strokes: s.strokes,
      par: getParForHole(s.holeNumber, player.genderFlight),
      shotgunBeer: s.shotgunBeer,
      rehit: s.rehit,
    })).sort((a, b) => a.holeNumber - b.holeNumber);

    const totalStrokes = scores.reduce((s, sc) => s + sc.strokes, 0);
    const totalPar = scores.reduce((s, sc) => s + sc.par, 0);

    tournamentResults.push({
      year: player.tournament.year,
      flight: player.genderFlight,
      teamName: player.team?.name || "",
      totalStrokes,
      toPar: totalStrokes - totalPar,
      holesPlayed: scores.length,
      beers: scores.filter((s) => s.shotgunBeer).length,
      paymentStatus: player.payment?.status || "unpaid",
      scores,
    });
  }

  tournamentResults.sort((a, b) => b.year - a.year);

  // Career stats
  const roundsWithScores = tournamentResults.filter((r) => r.holesPlayed > 0);
  const totalRounds = roundsWithScores.length;
  const totalHoles = roundsWithScores.reduce((s, r) => s + r.holesPlayed, 0);
  const totalBeers = roundsWithScores.reduce((s, r) => s + r.beers, 0);
  const bestToPar = roundsWithScores.length > 0 ? Math.min(...roundsWithScores.map((r) => r.toPar)) : null;
  const avgToPar = roundsWithScores.length > 0
    ? roundsWithScores.reduce((s, r) => s + r.toPar, 0) / roundsWithScores.length
    : null;

  // Awards from Hall of Fame
  const awards = await prisma.hallOfFameEntry.findMany({
    where: { winnerName: { in: players.map((p) => p.fullName), mode: "insensitive" } },
    orderBy: { year: "desc" },
  });

  // Donations by email
  const emails = [...new Set(players.map((p) => p.email))];
  const donations = await prisma.donation.aggregate({
    where: { donorEmail: { in: emails }, status: "completed" },
    _sum: { amount: true },
  });
  const totalDonated = (donations._sum.amount || 0) / 100;

  return (
    <PlayerProfile
      name={name}
      avatarUrl={avatarUrl}
      bio={bio}
      yearsPlayed={players.length}
      totalRounds={totalRounds}
      totalHoles={totalHoles}
      totalBeers={totalBeers}
      bestToPar={bestToPar}
      avgToPar={avgToPar}
      totalDonated={totalDonated}
      awards={awards.map((a) => ({
        year: a.year,
        category: a.category,
        description: a.description,
      }))}
      tournaments={tournamentResults}
    />
  );
}

async function getPlayersByAccountId(id: string) {
  const account = await prisma.userAccount.findUnique({
    where: { id },
    include: {
      players: {
        include: {
          tournament: {
            select: {
              year: true, name: true, numHoles: true, teeAssignments: true,
              course: {
                select: {
                  holes: {
                    where: { active: true },
                    select: { holeNumber: true, teeBoxes: { select: { name: true, par: true } } },
                  },
                },
              },
            },
          },
          team: { select: { name: true } },
          payment: { select: { status: true } },
          scores: { orderBy: { holeNumber: "asc" } },
        },
        orderBy: { tournament: { year: "desc" } },
      },
    },
  });
  if (!account) return null;
  return {
    name: account.name,
    avatarUrl: account.avatarUrl,
    bio: account.bio,
    players: account.players,
  };
}

async function getPlayersByPlayerId(id: string) {
  const player = await prisma.player.findUnique({
    where: { id },
    select: { email: true, fullName: true },
  });
  if (!player) return null;

  // Find all players with the same email across tournaments
  const allPlayers = await prisma.player.findMany({
    where: { email: player.email },
    include: {
      tournament: {
        select: {
          year: true, name: true, numHoles: true, teeAssignments: true,
          course: {
            select: {
              holes: {
                where: { active: true },
                select: { holeNumber: true, teeBoxes: { select: { name: true, par: true } } },
              },
            },
          },
        },
      },
      team: { select: { name: true } },
      payment: { select: { status: true } },
      scores: { orderBy: { holeNumber: "asc" } },
    },
    orderBy: { tournament: { year: "desc" } },
  });

  return {
    name: player.fullName,
    avatarUrl: null as string | null,
    bio: null as string | null,
    players: allPlayers,
  };
}
