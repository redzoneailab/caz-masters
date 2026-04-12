import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TOURNAMENT } from "@/lib/tournament";

export const revalidate = 30;

export async function GET() {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { year: TOURNAMENT.year },
      select: { id: true, maxPlayers: true },
    });

    const total = tournament?.maxPlayers ?? TOURNAMENT.maxPlayers;
    const filled = tournament
      ? await prisma.player.count({
          where: { tournamentId: tournament.id, waitlisted: false },
        })
      : 0;

    return NextResponse.json({ filled, total, remaining: total - filled });
  } catch {
    return NextResponse.json({ filled: 0, total: TOURNAMENT.maxPlayers, remaining: TOURNAMENT.maxPlayers });
  }
}
