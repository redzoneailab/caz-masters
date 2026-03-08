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
    include: { tournament: true },
  });
  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }
  if (team.locked || team.tournament.teamsLocked) {
    return NextResponse.json({ error: "Team is locked" }, { status: 400 });
  }

  const player = await prisma.player.findFirst({
    where: { userAccountId: session.userAccountId, tournamentId: team.tournamentId, teamId: id },
  });
  if (!player) {
    return NextResponse.json({ error: "You are not on this team" }, { status: 400 });
  }

  await prisma.player.update({
    where: { id: player.id },
    data: { teamId: null },
  });

  // Delete team if empty
  const remaining = await prisma.player.count({ where: { teamId: id } });
  if (remaining === 0) {
    await prisma.team.delete({ where: { id } });
  }

  return NextResponse.json({ success: true });
}
