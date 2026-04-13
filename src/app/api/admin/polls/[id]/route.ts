import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TOURNAMENT } from "@/lib/tournament";

function checkAuth(req: NextRequest) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.active !== undefined) data.active = body.active;
  if (body.showResultsBeforeClose !== undefined) data.showResultsBeforeClose = body.showResultsBeforeClose;
  if (body.title !== undefined) data.title = body.title;

  const poll = await prisma.poll.update({
    where: { id },
    data,
    include: {
      options: {
        include: { _count: { select: { votes: true } } },
      },
    },
  });

  return NextResponse.json({ poll });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.poll.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

// Declare winner: finalize poll and write awards to Hall of Fame + player profiles
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { winnerOptionId } = await req.json();

  if (!winnerOptionId) {
    return NextResponse.json({ error: "winnerOptionId is required" }, { status: 400 });
  }

  const poll = await prisma.poll.findUnique({
    where: { id },
    include: {
      tournament: true,
      options: {
        where: { id: winnerOptionId },
        include: {
          _count: { select: { votes: true } },
        },
      },
    },
  });

  if (!poll || poll.options.length === 0) {
    return NextResponse.json({ error: "Poll or option not found" }, { status: 404 });
  }

  const winnerOption = poll.options[0];
  const year = poll.tournament.year;

  // Create Hall of Fame entry
  await prisma.hallOfFameEntry.upsert({
    where: {
      year_category_winnerName: {
        year,
        category: "fan_vote",
        winnerName: winnerOption.label,
      },
    },
    update: {
      description: poll.title,
    },
    create: {
      year,
      category: "fan_vote",
      winnerName: winnerOption.label,
      description: poll.title,
      teamName: winnerOption.teamId ? winnerOption.label : null,
    },
  });

  // If team award, write HoF entries for each team member too
  if (poll.type === "team" && winnerOption.teamId) {
    const team = await prisma.team.findUnique({
      where: { id: winnerOption.teamId },
      include: { members: { select: { fullName: true } } },
    });

    if (team) {
      for (const member of team.members) {
        await prisma.hallOfFameEntry.upsert({
          where: {
            year_category_winnerName: {
              year,
              category: "fan_vote",
              winnerName: member.fullName,
            },
          },
          update: {
            description: poll.title,
            teamName: team.name,
          },
          create: {
            year,
            category: "fan_vote",
            winnerName: member.fullName,
            teamName: team.name,
            description: poll.title,
          },
        });
      }
    }
  }

  // Finalize the poll and close it
  await prisma.poll.update({
    where: { id },
    data: { finalized: true, active: false },
  });

  return NextResponse.json({ success: true, winner: winnerOption.label });
}
