import { prisma } from "@/lib/prisma";
import { TOURNAMENT } from "@/lib/tournament";

export async function getTournamentSettings() {
  const tournament = await prisma.tournament.findUnique({
    where: { year: TOURNAMENT.year },
    select: { freeRegistration: true, entryFee: true },
  });

  return {
    freeRegistration: tournament?.freeRegistration ?? false,
    entryFee: tournament ? tournament.entryFee / 100 : TOURNAMENT.entryFee,
  };
}
