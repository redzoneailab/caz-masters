import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.userAccountId) {
    return NextResponse.json({ error: "Sign in to vote" }, { status: 401 });
  }

  const { id: pollId } = await params;
  const { optionId } = await req.json();

  if (!optionId) {
    return NextResponse.json({ error: "optionId is required" }, { status: 400 });
  }

  // Verify poll exists and is active
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: {
      options: { select: { id: true, teamId: true, playerId: true } },
    },
  });

  if (!poll || !poll.active) {
    return NextResponse.json({ error: "Poll not found or closed" }, { status: 404 });
  }

  // Verify option belongs to this poll
  const option = poll.options.find((o) => o.id === optionId);
  if (!option) {
    return NextResponse.json({ error: "Invalid option" }, { status: 400 });
  }

  // Prevent self-voting
  const player = await prisma.player.findFirst({
    where: {
      userAccountId: session.userAccountId as string,
      tournamentId: poll.tournamentId,
    },
    select: { id: true, teamId: true },
  });

  if (player) {
    if (poll.type === "team" && option.teamId && player.teamId === option.teamId) {
      return NextResponse.json({ error: "You can't vote for your own team" }, { status: 400 });
    }
    if (poll.type === "individual" && option.playerId === player.id) {
      return NextResponse.json({ error: "You can't vote for yourself" }, { status: 400 });
    }
  }

  // Check for existing vote on this poll
  const existingVote = await prisma.vote.findFirst({
    where: {
      userAccountId: session.userAccountId as string,
      option: { pollId },
    },
  });

  if (existingVote) {
    return NextResponse.json({ error: "You've already voted on this poll" }, { status: 400 });
  }

  await prisma.vote.create({
    data: {
      optionId,
      userAccountId: session.userAccountId as string,
    },
  });

  return NextResponse.json({ success: true });
}
