import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TOURNAMENT } from "@/lib/tournament";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);

  const tournament = await prisma.tournament.findUnique({
    where: { year: TOURNAMENT.year },
  });

  if (!tournament) {
    return NextResponse.json({ polls: [] });
  }

  const polls = await prisma.poll.findMany({
    where: {
      tournamentId: tournament.id,
      active: true,
    },
    include: {
      options: {
        include: { _count: { select: { votes: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Get user's existing votes
  let userVotes: Record<string, string> = {};
  if (session?.userAccountId) {
    const votes = await prisma.vote.findMany({
      where: {
        userAccountId: session.userAccountId as string,
        option: {
          poll: { tournamentId: tournament.id, active: true },
        },
      },
      select: { option: { select: { pollId: true } }, optionId: true },
    });
    for (const v of votes) {
      userVotes[v.option.pollId] = v.optionId;
    }
  }

  // Get user's player record to prevent self-voting
  let userTeamId: string | null = null;
  let userPlayerId: string | null = null;
  if (session?.userAccountId) {
    const player = await prisma.player.findFirst({
      where: { userAccountId: session.userAccountId as string, tournamentId: tournament.id },
      select: { id: true, teamId: true },
    });
    if (player) {
      userPlayerId = player.id;
      userTeamId = player.teamId;
    }
  }

  const result = polls.map((poll) => ({
    id: poll.id,
    title: poll.title,
    type: poll.type,
    showResultsBeforeClose: poll.showResultsBeforeClose,
    finalized: poll.finalized,
    options: poll.options.map((o) => ({
      id: o.id,
      label: o.label,
      teamId: o.teamId,
      playerId: o.playerId,
      voteCount: o._count.votes,
    })),
    totalVotes: poll.options.reduce((s, o) => s + o._count.votes, 0),
    userVotedOptionId: userVotes[poll.id] || null,
  }));

  return NextResponse.json({
    polls: result,
    userTeamId,
    userPlayerId,
    signedIn: !!session,
  });
}
