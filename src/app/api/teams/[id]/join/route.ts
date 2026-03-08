import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.userAccountId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const team = await prisma.team.findUnique({
    where: { id },
    include: { members: true, tournament: true },
  });
  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }
  if (team.locked || team.tournament.teamsLocked) {
    return NextResponse.json({ error: "Team is locked" }, { status: 400 });
  }
  if (team.members.length >= team.maxSize) {
    return NextResponse.json({ error: "Team is full" }, { status: 400 });
  }

  const player = await prisma.player.findFirst({
    where: { userAccountId: session.userAccountId, tournamentId: team.tournamentId },
  });
  if (!player) {
    return NextResponse.json({ error: "You must be registered for the tournament" }, { status: 400 });
  }

  // Remove from any existing team first
  await prisma.player.update({
    where: { id: player.id },
    data: { teamId: id },
  });

  return NextResponse.json({ success: true });
}
