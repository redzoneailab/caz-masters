import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getTeeBoxName, isMensFlight, TeeAssignments } from "@/lib/tees";

export const metadata = {
  title: "Hall of Fame",
  description: "Past champions and award winners of The Caz Masters tournament.",
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

const CATEGORIES: Record<string, string> = {
  mens_individual: "Men's Champion",
  womens_individual: "Women's Champion",
  senior_individual: "Senior Champion",
  team: "Winning Team",
  shotgun_champion: "Shotgun Champion",
  special_award: "Special Award",
};

// Champion photos by year (static assets)
const CHAMPION_PHOTOS: Record<number, { src: string; label: string }[]> = {
  2015: [{ src: "/images/champion-2015.png", label: "2015 Champion" }],
  2016: [{ src: "/images/champion-2016.jpg", label: "2016 Champion" }],
  2017: [{ src: "/images/champion-2017.png", label: "2017 Champion" }],
  2018: [{ src: "/images/champion-2018.png", label: "2018 Champion" }],
  2019: [{ src: "/images/team-winner-2019.jpg", label: "2019 Team Champs" }],
};

const CATEGORY_ICONS: Record<string, string> = {
  mens_individual: "\uD83C\uDFC6",
  womens_individual: "\uD83C\uDFC6",
  senior_individual: "\uD83C\uDFC6",
  team: "\uD83E\uDD4A",
  shotgun_champion: "\uD83C\uDF7A",
  special_award: "\u2B50",
};

interface YearResult {
  year: number;
  edition: number;
  entries: { category: string; winnerName: string; teamName?: string; description?: string; score?: number }[];
  fromScores: boolean;
}

function EmptyState() {
  return (
    <>
      <section className="bg-navy-950 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl font-black uppercase tracking-tight">Hall of Fame</h1>
          <p className="mt-3 text-navy-300 max-w-2xl mx-auto">
            Celebrating the champions of The Caz Masters at Cazenovia Golf Club.
          </p>
        </div>
      </section>
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-center text-navy-400 py-12">
            Hall of Fame entries coming soon. Check back after the admin adds historical results.
          </p>
        </div>
      </section>
    </>
  );
}

export default async function HistoryPage() {
  let hofEntries: Awaited<ReturnType<typeof prisma.hallOfFameEntry.findMany>>;
  let finalizedTournaments: Awaited<ReturnType<typeof fetchFinalizedTournaments>>;

  try {
    [hofEntries, finalizedTournaments] = await Promise.all([
      prisma.hallOfFameEntry.findMany({
        orderBy: [{ year: "desc" }, { category: "asc" }],
      }),
      fetchFinalizedTournaments(),
    ]);
  } catch {
    return <EmptyState />;
  }

  const hofByYear = hofEntries.reduce<Record<number, typeof hofEntries>>((acc, entry) => {
    if (!acc[entry.year]) acc[entry.year] = [];
    acc[entry.year].push(entry);
    return acc;
  }, {});

  // Build auto-populated results for finalized tournaments without HoF entries
  const autoResults: YearResult[] = [];

  for (const tournament of finalizedTournaments) {
    // Skip if HoF entries already exist for this year
    if (hofByYear[tournament.year]) continue;

    const scores = await prisma.score.findMany({
      where: { tournamentId: tournament.id },
      include: { player: { select: { id: true, fullName: true, genderFlight: true, teamId: true, team: { select: { name: true } } } } },
    });

    if (scores.length === 0) continue;

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

    // Individual standings
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

    const entries: YearResult["entries"] = [];

    // Men's champion
    const mensComplete = standings
      .filter((s) => isMensFlight(s.flight) && s.holesCompleted >= tournament.numHoles)
      .sort((a, b) => a.toPar - b.toPar);
    if (mensComplete.length > 0) {
      entries.push({
        category: "mens_individual",
        winnerName: mensComplete[0].name,
        teamName: mensComplete[0].teamName,
        description: formatScore(mensComplete[0].toPar, mensComplete[0].totalStrokes),
      });
    }

    // Women's champion
    const womensComplete = standings
      .filter((s) => !isMensFlight(s.flight) && s.holesCompleted >= tournament.numHoles)
      .sort((a, b) => a.toPar - b.toPar);
    if (womensComplete.length > 0) {
      entries.push({
        category: "womens_individual",
        winnerName: womensComplete[0].name,
        teamName: womensComplete[0].teamName,
        description: formatScore(womensComplete[0].toPar, womensComplete[0].totalStrokes),
      });
    }

    // Team Stableford winner
    const teamResults = tournament.teams.map((team) => {
      let totalPoints = 0;
      for (const hole of courseHoles) {
        if (hole.holeNumber > tournament.numHoles) continue;
        const holePoints = team.members
          .map((m) => {
            const memberScores = byPlayer.get(m.id) || [];
            const score = memberScores.find((s) => s.holeNumber === hole.holeNumber);
            if (!score) return null;
            return stablefordPoints(score.strokes, getParForPlayer(hole.holeNumber, m.genderFlight));
          })
          .filter((p): p is number => p !== null);

        if (holePoints.length === 0) continue;
        let points = [...holePoints];
        if (points.length === 5) {
          points.sort((a, b) => a - b);
          points.splice(2, 1);
        }
        totalPoints += points.reduce((s, p) => s + p, 0);
      }
      return { name: team.name, points: totalPoints };
    }).sort((a, b) => b.points - a.points);

    if (teamResults.length > 0 && teamResults[0].points > 0) {
      entries.push({
        category: "team",
        winnerName: teamResults[0].name,
        description: `${teamResults[0].points} Stableford points`,
      });
    }

    // Shotgun champion
    const shotgunLeader = standings.filter((s) => s.beers > 0).sort((a, b) => b.beers - a.beers);
    if (shotgunLeader.length > 0) {
      entries.push({
        category: "shotgun_champion",
        winnerName: shotgunLeader[0].name,
        teamName: shotgunLeader[0].teamName,
        description: `${shotgunLeader[0].beers} shotgun${shotgunLeader[0].beers !== 1 ? "s" : ""}`,
      });
    }

    if (entries.length > 0) {
      autoResults.push({
        year: tournament.year,
        edition: tournament.year - 2011,
        entries,
        fromScores: true,
      });
    }
  }

  // Combine HoF entries and auto-results
  const hofYears: YearResult[] = Object.entries(hofByYear).map(([yearStr, entries]) => ({
    year: parseInt(yearStr),
    edition: parseInt(yearStr) - 2011,
    entries: entries.map((e) => ({
      category: e.category,
      winnerName: e.winnerName,
      teamName: e.teamName || undefined,
      description: e.description || undefined,
      score: e.score ?? undefined,
    })),
    fromScores: false,
  }));

  const allYears = [...hofYears, ...autoResults].sort((a, b) => b.year - a.year);

  function ordinal(n: number): string {
    if (n === 1) return "1st";
    if (n === 2) return "2nd";
    if (n === 3) return "3rd";
    return `${n}th`;
  }

  return (
    <>
      {/* Hero */}
      <section className="relative bg-navy-950 text-white py-16 sm:py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Image src="/images/group-2018.jpg" alt="" fill className="object-cover" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-gold-400 font-bold text-sm uppercase tracking-widest mb-3">
            The Caz Masters
          </p>
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight">Hall of Fame</h1>
          <p className="mt-4 text-navy-300 max-w-2xl mx-auto text-lg">
            Legends of the game. Or at least legends of this game.
          </p>
        </div>
      </section>

      {/* Reigning Champion Spotlight */}
      <section className="bg-navy-900 text-white py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-gold-400/30 shadow-2xl">
              <Image
                src="/images/new-champ.jpg"
                alt="Reigning Champion"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-gold-400 font-bold text-sm uppercase tracking-widest mb-2">
                Reigning Champion
              </p>
              <h2 className="text-3xl sm:text-4xl font-black uppercase mb-4">
                The Green Jacket Holder
              </h2>
              <p className="text-navy-300 text-lg leading-relaxed">
                Every year, one player rises above the rest and earns the right to wear the
                green jacket. Their name goes up on the wall. Their legend lives forever.
                Or at least until next July 3rd.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Year-by-Year Results */}
      <section className="py-12 sm:py-16 bg-[#F0F4F8]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-black text-navy-900 uppercase mb-8 text-center">
            Champions by Year
          </h2>
          {allYears.length === 0 ? (
            <p className="text-center text-navy-400 py-12">
              Hall of Fame entries coming soon. Check back after the admin adds historical results.
            </p>
          ) : (
            <div className="space-y-8">
              {allYears.map((yearData) => {
                const photos = CHAMPION_PHOTOS[yearData.year];
                return (
                  <div
                    key={yearData.year}
                    className="bg-white rounded-2xl overflow-hidden border border-navy-100 shadow-sm"
                  >
                    {/* Year header */}
                    <div className="bg-navy-950 text-white px-6 py-4 flex items-center justify-between">
                      <h3 className="text-2xl font-black">
                        {yearData.year}
                      </h3>
                      <span className="text-gold-400 font-bold text-sm uppercase tracking-wider">
                        {ordinal(yearData.edition)} Annual
                      </span>
                    </div>

                    <div className={`${photos ? "grid md:grid-cols-5" : ""}`}>
                      {/* Photo column */}
                      {photos && (
                        <div className="md:col-span-2 p-4">
                          {photos.map((photo) => (
                            <div key={photo.src} className="relative aspect-[4/3] rounded-xl overflow-hidden">
                              <Image
                                src={photo.src}
                                alt={photo.label}
                                fill
                                className="object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                              <p className="absolute bottom-3 left-3 text-white font-bold text-sm">
                                {photo.label}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Awards column */}
                      <div className={`${photos ? "md:col-span-3" : ""} p-6`}>
                        {yearData.fromScores && (
                          <p className="text-xs text-gold-600 font-medium mb-4 uppercase tracking-wider">
                            Auto-generated from scores
                          </p>
                        )}
                        <div className="grid sm:grid-cols-2 gap-5">
                          {(["mens_individual", "womens_individual", "senior_individual", "team", "shotgun_champion", "special_award"] as const).map((cat) => {
                            const catEntries = yearData.entries.filter((e) => e.category === cat);
                            if (catEntries.length === 0) return null;
                            return (
                              <div key={cat} className="flex gap-3">
                                <span className="text-xl mt-0.5">{CATEGORY_ICONS[cat]}</span>
                                <div>
                                  <p className="text-xs font-bold text-gold-500 uppercase tracking-wider mb-1">
                                    {CATEGORIES[cat]}
                                  </p>
                                  {catEntries.map((entry, i) => (
                                    <div key={i}>
                                      <p className="text-navy-900 font-bold text-lg leading-tight">
                                        {entry.winnerName}
                                        {entry.score != null && (
                                          <span className="text-navy-400 font-medium text-base ml-2">
                                            {cat === "team"
                                              ? `${entry.score} pts`
                                              : cat === "shotgun_champion"
                                              ? `${entry.score} beers`
                                              : entry.score}
                                          </span>
                                        )}
                                      </p>
                                      {entry.teamName && (
                                        <p className="text-navy-500 text-sm">{entry.teamName}</p>
                                      )}
                                      {entry.description && (
                                        <p className="text-navy-400 text-sm">{entry.description}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

async function fetchFinalizedTournaments() {
  return prisma.tournament.findMany({
    where: { finalized: true },
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
    orderBy: { year: "desc" },
  });
}
