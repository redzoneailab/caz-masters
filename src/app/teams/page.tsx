import { prisma } from "@/lib/prisma";
import { TOURNAMENT } from "@/lib/tournament";
import TeamsBoard from "./TeamsBoard";

export const metadata = {
  title: "Teams",
  description: "Form your team for the 15th Annual Caz Masters tournament.",
};

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const tournament = await prisma.tournament.findUnique({
    where: { year: TOURNAMENT.year },
    include: {
      teams: {
        include: {
          members: {
            select: { id: true, fullName: true, genderFlight: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      players: {
        where: { teamId: null },
        select: { id: true, fullName: true, genderFlight: true },
        orderBy: { fullName: "asc" },
      },
    },
  });

  return (
    <>
      <section className="bg-navy-950 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl font-black uppercase tracking-tight">Team Board</h1>
          <p className="mt-3 text-navy-300 max-w-2xl mx-auto">
            Teams of 4 compete together. Sign in with Google to create or join a team.
            Free agents will be assigned teams before the tournament.
          </p>
        </div>
      </section>
      <TeamsBoard
        teams={tournament?.teams || []}
        freeAgents={tournament?.players || []}
        teamsLocked={tournament?.teamsLocked || false}
        tournamentId={tournament?.id || ""}
      />
    </>
  );
}
