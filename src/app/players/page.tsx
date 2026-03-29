import { prisma } from "@/lib/prisma";
import PlayerDirectory from "./PlayerDirectory";

export const metadata = {
  title: "Player Directory",
  description: "All-time player directory for The Caz Masters tournament.",
};

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  let allPlayers: Awaited<ReturnType<typeof fetchPlayers>>;
  try {
    allPlayers = await fetchPlayers();
  } catch {
    return (
      <>
        <section className="bg-navy-950 text-white py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <h1 className="text-4xl font-black uppercase tracking-tight">Player Directory</h1>
            <p className="mt-3 text-navy-300 max-w-2xl mx-auto">
              All-time player directory for The Caz Masters tournament.
            </p>
          </div>
        </section>
        <section className="py-12 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <p className="text-center text-navy-400 py-12">
              No players yet — check back after registrations open!
            </p>
          </div>
        </section>
      </>
    );
  }

  // Group by email to deduplicate across tournaments
  const byEmail = new Map<string, typeof allPlayers>();
  for (const p of allPlayers) {
    const arr = byEmail.get(p.email) || [];
    arr.push(p);
    byEmail.set(p.email, arr);
  }

  const directory = Array.from(byEmail.values()).map((players) => {
    const latest = players.sort((a, b) => b.tournament.year - a.tournament.year)[0];
    const years = players.map((p) => p.tournament.year).sort((a, b) => b - a);
    const hasScores = players.some((p) => p.scores.length > 0);
    return {
      name: latest.fullName,
      flight: latest.genderFlight,
      profileId: latest.userAccountId || latest.id,
      years,
      tournamentsPlayed: years.length,
      hasScores,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  const tournamentCount = new Set(allPlayers.map((p) => p.tournament.year)).size;

  return (
    <>
      <section className="bg-navy-950 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl font-black uppercase tracking-tight">Player Directory</h1>
          <p className="mt-3 text-navy-300 max-w-2xl mx-auto">
            {directory.length > 0
              ? `${directory.length} player${directory.length !== 1 ? "s have" : " has"} competed in The Caz Masters across ${tournamentCount} tournament${tournamentCount !== 1 ? "s" : ""}.`
              : "No players registered yet — check back after registrations open!"}
          </p>
        </div>
      </section>
      <PlayerDirectory players={directory} />
    </>
  );
}

async function fetchPlayers() {
  return prisma.player.findMany({
    select: {
      id: true,
      fullName: true,
      email: true,
      genderFlight: true,
      userAccountId: true,
      tournament: { select: { year: true } },
      scores: { select: { id: true }, take: 1 },
    },
    orderBy: { fullName: "asc" },
  });
}
