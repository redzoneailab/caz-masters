import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TOURNAMENT } from "@/lib/tournament";

export const revalidate = 30;

export async function GET() {
  const tournament = await prisma.tournament.findUnique({
    where: { year: TOURNAMENT.year },
    select: { id: true, freeRegistration: true, entryFee: true, forceWaitlist: true, maxPlayers: true },
  });

  const filled = tournament
    ? await prisma.player.count({ where: { tournamentId: tournament.id, waitlisted: false } })
    : 0;
  const atCapacity = tournament ? filled >= tournament.maxPlayers : false;

  return NextResponse.json({
    freeRegistration: tournament?.freeRegistration ?? false,
    entryFee: tournament ? tournament.entryFee / 100 : TOURNAMENT.entryFee,
    waitlistMode: (tournament?.forceWaitlist ?? false) || atCapacity,
  });
}
