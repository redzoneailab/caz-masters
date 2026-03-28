import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TOURNAMENT } from "@/lib/tournament";

function checkAuth(req: NextRequest) {
  return req.headers.get("authorization") === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tournament = await prisma.tournament.findUnique({
    where: { year: TOURNAMENT.year },
  });
  if (!tournament) {
    return NextResponse.json({ scores: [] });
  }

  const scores = await prisma.score.findMany({
    where: { tournamentId: tournament.id },
    include: {
      player: {
        select: { id: true, fullName: true, genderFlight: true, team: { select: { name: true } } },
      },
    },
    orderBy: [{ player: { fullName: "asc" } }, { holeNumber: "asc" }],
  });

  return NextResponse.json({ scores, tournamentId: tournament.id });
}
