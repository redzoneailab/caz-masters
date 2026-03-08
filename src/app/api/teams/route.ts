import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TOURNAMENT } from "@/lib/tournament";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.userAccountId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { name, tournamentId } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Team name is required" }, { status: 400 });
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });
  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }
  if (tournament.teamsLocked) {
    return NextResponse.json({ error: "Teams are locked" }, { status: 400 });
  }

  // Find the player record for this user in this tournament
  const player = await prisma.player.findFirst({
    where: { userAccountId: session.userAccountId, tournamentId },
  });
  if (!player) {
    return NextResponse.json({ error: "You must be registered for the tournament" }, { status: 400 });
  }

  // Create team and add the player
  const team = await prisma.team.create({
    data: {
      name: name.trim(),
      tournamentId,
      members: { connect: { id: player.id } },
    },
    include: { members: { select: { id: true, fullName: true, genderFlight: true } } },
  });

  return NextResponse.json({ team }, { status: 201 });
}
