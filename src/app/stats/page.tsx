import { prisma } from "@/lib/prisma";
import { getTeeBoxName, TeeAssignments } from "@/lib/tees";

export const metadata = {
  title: "All-Time Stats",
  description: "Records, milestones, and all-time leaderboards from The Caz Masters.",
};

export const dynamic = "force-dynamic";

function stablefordPoints(strokes: number, par: number): number {
  const diff = strokes - par;
  if (diff <= -3) return 5; // Albatross or better
  if (diff === -2) return 4; // Eagle
  if (diff === -1) return 3; // Birdie
  if (diff === 0) return 2;  // Par
  if (diff === 1) return 1;  // Bogey
  return 0; // Double bogey+
}

interface TournamentRound {
  playerName: string;
  year: number;
  toPar: number;
  totalStrokes: number;
  holesPlayed: number;
  beers: number;
  teamName: string;
}

function formatToPar(toPar: number) {
  if (toPar < 0) return toPar.toString();
  if (toPar === 0) return "E";
  return `+${toPar}`;
}

function EmptyState() {
  return (
    <>
      <section className="bg-navy-950 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl font-black uppercase tracking-tight">All-Time Stats</h1>
          <p className="mt-3 text-navy-300 max-w-2xl mx-auto">
            Records, milestones, and bragging rights from The Caz Masters.
          </p>
        </div>
      </section>
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-center text-navy-400 py-12">
            No stats yet — check back after the tournament!
          </p>
        </div>
      </section>
    </>
  );
}

export default async function StatsPage() {
  // Use separate simpler queries to avoid deep nesting validation issues
  let tournaments: Awaited<ReturnType<typeof fetchTournaments>>;
  let allPlayers: Awaited<ReturnType<typeof fetchPlayers>>;
  let allTeams: Awaited<ReturnType<typeof fetchTeams>>;
  let hofEntries: Awaited<ReturnType<typeof fetchHof>>;

  try {
    [tournaments, allPlayers, allTeams, hofEntries] = await Promise.all([
      fetchTournaments(),
      fetchPlayers(),
      fetchTeams(),
      fetchHof(),
    ]);
  } catch {
    return <EmptyState />;
  }

  if (tournaments.length === 0) {
    return <EmptyState />;
  }

  // Index tournaments by id
  const tournamentById = new Map(tournaments.map((t) => [t.id, t]));

  // Group players by tournamentId
  const playersByTournament = new Map<string, typeof allPlayers>();
  for (const p of allPlayers) {
    const arr = playersByTournament.get(p.tournamentId) || [];
    arr.push(p);
    playersByTournament.set(p.tournamentId, arr);
  }

  // Group teams by tournamentId
  const teamsByTournament = new Map<string, typeof allTeams>();
  for (const t of allTeams) {
    const arr = teamsByTournament.get(t.tournamentId) || [];
    arr.push(t);
    teamsByTournament.set(t.tournamentId, arr);
  }

  // Build all individual rounds
  const allRounds: TournamentRound[] = [];
  const playerCareerBeers = new Map<string, { name: string; total: number }>();
  const playerTournamentCount = new Map<string, { name: string; count: number }>();
  const teamStablefordRecords: { teamName: string; year: number; points: number }[] = [];

  for (const tournament of tournaments) {
    const courseHoles = tournament.course?.holes || [];

    // Build tee map for this tournament
    const teeMap = new Map<number, Map<string, number>>();
    for (const hole of courseHoles) {
      const tees = new Map<string, number>();
      for (const tb of hole.teeBoxes) {
        tees.set(tb.name, tb.par);
      }
      teeMap.set(hole.holeNumber, tees);
    }

    const teeAssignments = (tournament.teeAssignments as TeeAssignments | null) ?? null;

    function getParForPlayer(holeNumber: number, genderFlight: string): number {
      const holeTees = teeMap.get(holeNumber);
      const availableTees = holeTees ? Array.from(holeTees.keys()) : undefined;
      const teeName = getTeeBoxName(holeNumber, genderFlight, availableTees, teeAssignments);
      return holeTees?.get(teeName) || 4;
    }

    // Individual rounds
    const players = playersByTournament.get(tournament.id) || [];
    for (const player of players) {
      if (player.scores.length === 0) continue;

      const totalStrokes = player.scores.reduce((s, sc) => s + sc.strokes, 0);
      const totalPar = player.scores.reduce(
        (s, sc) => s + getParForPlayer(sc.holeNumber, player.genderFlight), 0
      );
      const beers = player.scores.filter((s) => s.shotgunBeer).length;

      allRounds.push({
        playerName: player.fullName,
        year: tournament.year,
        toPar: totalStrokes - totalPar,
        totalStrokes,
        holesPlayed: player.scores.length,
        beers,
        teamName: player.team?.name || "",
      });

      const key = player.fullName.toLowerCase();
      const existing = playerCareerBeers.get(key);
      playerCareerBeers.set(key, {
        name: player.fullName,
        total: (existing?.total || 0) + beers,
      });

      const tc = playerTournamentCount.get(key);
      playerTournamentCount.set(key, {
        name: player.fullName,
        count: (tc?.count || 0) + 1,
      });
    }

    // Team Stableford for this tournament
    const teams = teamsByTournament.get(tournament.id) || [];
    for (const team of teams) {
      let totalPoints = 0;

      // Build member scores lookup
      const memberScoresByHole = new Map<string, Map<number, { strokes: number; holeNumber: number }>>();
      for (const member of team.members) {
        const byHole = new Map<number, { strokes: number; holeNumber: number }>();
        for (const s of member.scores) {
          if (s.tournamentId === tournament.id) {
            byHole.set(s.holeNumber, s);
          }
        }
        memberScoresByHole.set(member.id, byHole);
      }

      for (const hole of courseHoles) {
        if (hole.holeNumber > tournament.numHoles) continue;
        const holeEntries = team.members
          .map((m) => {
            const score = memberScoresByHole.get(m.id)?.get(hole.holeNumber);
            if (!score) return null;
            return stablefordPoints(score.strokes, getParForPlayer(hole.holeNumber, m.genderFlight));
          })
          .filter((p): p is number => p !== null);

        if (holeEntries.length === 0) continue;

        let points = [...holeEntries];
        if (points.length === 5) {
          points.sort((a, b) => a - b);
          points.splice(2, 1);
        }
        totalPoints += points.reduce((s, p) => s + p, 0);
      }

      if (totalPoints > 0) {
        teamStablefordRecords.push({ teamName: team.name, year: tournament.year, points: totalPoints });
      }
    }
  }

  // Compute records
  const completedRounds = allRounds.filter((r) => {
    const t = tournaments.find((t) => t.year === r.year);
    return t && r.holesPlayed >= t.numHoles;
  });

  const lowestRounds = [...completedRounds].sort((a, b) => a.toPar - b.toPar).slice(0, 10);
  const mostSingleRoundBeers = [...allRounds].filter((r) => r.beers > 0).sort((a, b) => b.beers - a.beers).slice(0, 10);
  const mostCareerBeers = [...playerCareerBeers.values()].filter((p) => p.total > 0).sort((a, b) => b.total - a.total).slice(0, 10);
  const mostTournaments = [...playerTournamentCount.values()].sort((a, b) => b.count - a.count).slice(0, 10);
  const bestTeamStableford = [...teamStablefordRecords].sort((a, b) => b.points - a.points).slice(0, 10);

  // Career wins from HoF
  const winsMap = new Map<string, { name: string; wins: number }>();
  for (const entry of hofEntries) {
    if (entry.category === "mens_individual" || entry.category === "womens_individual") {
      const existing = winsMap.get(entry.winnerName);
      winsMap.set(entry.winnerName, {
        name: entry.winnerName,
        wins: (existing?.wins || 0) + 1,
      });
    }
  }
  const careerWins = [...winsMap.values()].sort((a, b) => b.wins - a.wins).slice(0, 10);

  const hasAnyData = allRounds.length > 0 || careerWins.length > 0;

  return (
    <>
      <section className="bg-navy-950 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl font-black uppercase tracking-tight">All-Time Stats</h1>
          <p className="mt-3 text-navy-300 max-w-2xl mx-auto">
            Records, milestones, and bragging rights across {tournaments.length} tournament{tournaments.length !== 1 ? "s" : ""} of The Caz Masters.
          </p>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
          {!hasAnyData && (
            <p className="text-center text-navy-400 py-12">
              No stats yet — check back after the tournament!
            </p>
          )}

          {/* Lowest Rounds Ever */}
          {lowestRounds.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-navy-900 mb-4">Lowest Rounds</h2>
              <div className="bg-white rounded-xl border border-navy-100 divide-y divide-navy-50">
                {lowestRounds.map((r, i) => (
                  <div key={`${r.playerName}-${r.year}-${i}`} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-navy-400 font-bold w-8">{i + 1}</span>
                      <div>
                        <p className="font-semibold text-navy-900">{r.playerName}</p>
                        <p className="text-xs text-navy-500">{r.year}{r.teamName ? ` \u00b7 ${r.teamName}` : ""}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${r.toPar < 0 ? "text-red-600" : r.toPar === 0 ? "text-navy-900" : "text-navy-600"}`}>
                        {formatToPar(r.toPar)}
                      </p>
                      <p className="text-xs text-navy-400">{r.totalStrokes} ({r.holesPlayed} holes)</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Career Wins */}
          {careerWins.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-navy-900 mb-4">Most Career Wins</h2>
              <div className="bg-white rounded-xl border border-navy-100 divide-y divide-navy-50">
                {careerWins.map((w, i) => (
                  <div key={`${w.name}-${i}`} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-navy-400 font-bold w-8">{i + 1}</span>
                      <p className="font-semibold text-navy-900">{w.name}</p>
                    </div>
                    <p className="font-bold text-gold-600">{w.wins} win{w.wins !== 1 ? "s" : ""}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Best Team Stableford */}
          {bestTeamStableford.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-navy-900 mb-4">Best Team Stableford Scores</h2>
              <div className="bg-white rounded-xl border border-navy-100 divide-y divide-navy-50">
                {bestTeamStableford.map((t, i) => (
                  <div key={`${t.teamName}-${t.year}-${i}`} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-navy-400 font-bold w-8">{i + 1}</span>
                      <div>
                        <p className="font-semibold text-navy-900">{t.teamName}</p>
                        <p className="text-xs text-navy-500">{t.year}</p>
                      </div>
                    </div>
                    <p className="font-bold text-gold-600">{t.points} pts</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Most Tournaments Played */}
          {mostTournaments.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-navy-900 mb-4">Most Tournaments Played</h2>
              <div className="bg-white rounded-xl border border-navy-100 divide-y divide-navy-50">
                {mostTournaments.map((p, i) => (
                  <div key={`${p.name}-${i}`} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-navy-400 font-bold w-8">{i + 1}</span>
                      <p className="font-semibold text-navy-900">{p.name}</p>
                    </div>
                    <p className="font-bold text-navy-600">{p.count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Most Single-Round Shotguns */}
          {mostSingleRoundBeers.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-navy-900 mb-4">Most Shotguns in a Single Round</h2>
              <div className="bg-white rounded-xl border border-navy-100 divide-y divide-navy-50">
                {mostSingleRoundBeers.map((r, i) => (
                  <div key={`${r.playerName}-${r.year}-${i}`} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-navy-400 font-bold w-8">{i + 1}</span>
                      <div>
                        <p className="font-semibold text-navy-900">{r.playerName}</p>
                        <p className="text-xs text-navy-500">{r.year}</p>
                      </div>
                    </div>
                    <p className="font-bold text-gold-600">{r.beers}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Most Career Shotguns */}
          {mostCareerBeers.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-navy-900 mb-4">Most Career Shotguns</h2>
              <div className="bg-white rounded-xl border border-navy-100 divide-y divide-navy-50">
                {mostCareerBeers.map((p, i) => (
                  <div key={`${p.name}-${i}`} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-navy-400 font-bold w-8">{i + 1}</span>
                      <p className="font-semibold text-navy-900">{p.name}</p>
                    </div>
                    <p className="font-bold text-gold-600">{p.total}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

// Separate query functions to avoid deep nesting validation issues
async function fetchTournaments() {
  return prisma.tournament.findMany({
    include: {
      course: {
        include: {
          holes: {
            where: { active: true },
            include: { teeBoxes: true },
          },
        },
      },
    },
    orderBy: { year: "desc" },
  });
}

async function fetchPlayers() {
  return prisma.player.findMany({
    include: {
      scores: true,
      team: { select: { name: true } },
    },
  });
}

async function fetchTeams() {
  return prisma.team.findMany({
    include: {
      members: {
        include: { scores: true },
      },
    },
  });
}

async function fetchHof() {
  return prisma.hallOfFameEntry.findMany();
}
