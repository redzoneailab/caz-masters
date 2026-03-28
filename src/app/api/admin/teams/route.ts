import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TOURNAMENT } from "@/lib/tournament";

function checkAuth(req: NextRequest) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tournament = await prisma.tournament.findUnique({
    where: { year: TOURNAMENT.year },
  });

  const teams = await prisma.team.findMany({
    where: { tournamentId: tournament?.id },
    include: {
      members: {
        select: { id: true, fullName: true, genderFlight: true, email: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const freeAgents = await prisma.player.findMany({
    where: { tournamentId: tournament?.id, teamId: null },
    select: { id: true, fullName: true, genderFlight: true, email: true },
    orderBy: { fullName: "asc" },
  });

  return NextResponse.json({
    teams,
    freeAgents,
    teamsLocked: tournament?.teamsLocked || false,
    tournamentId: tournament?.id,
    shotgunStart: tournament?.shotgunStart ?? true,
    numHoles: tournament?.numHoles ?? 18,
  });
}

// Toggle teams locked
export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamsLocked } = await req.json();

  const tournament = await prisma.tournament.findUnique({
    where: { year: TOURNAMENT.year },
  });
  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  await prisma.tournament.update({
    where: { id: tournament.id },
    data: { teamsLocked },
  });

  return NextResponse.json({ success: true });
}
