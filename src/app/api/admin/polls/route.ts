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

  if (!tournament) {
    return NextResponse.json({ polls: [] });
  }

  const polls = await prisma.poll.findMany({
    where: { tournamentId: tournament.id },
    include: {
      options: {
        include: { _count: { select: { votes: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ polls });
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, type, options, autoPopulate } = await req.json();

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const pollType = type === "individual" ? "individual" : "team";

  let tournament = await prisma.tournament.findUnique({
    where: { year: TOURNAMENT.year },
  });

  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 400 });
  }

  // Auto-populate options from teams or players
  let optionData: { label: string; teamId?: string; playerId?: string }[] = [];

  if (autoPopulate) {
    if (pollType === "team") {
      const teams = await prisma.team.findMany({
        where: { tournamentId: tournament.id },
        orderBy: { name: "asc" },
      });
      optionData = teams.map((t) => ({ label: t.name, teamId: t.id }));
    } else {
      const players = await prisma.player.findMany({
        where: { tournamentId: tournament.id, waitlisted: false },
        orderBy: { fullName: "asc" },
      });
      optionData = players.map((p) => ({ label: p.fullName, playerId: p.id }));
    }
  }

  // Add any custom options
  if (options && Array.isArray(options)) {
    for (const label of options) {
      if (label && !optionData.some((o) => o.label === label)) {
        optionData.push({ label });
      }
    }
  }

  const poll = await prisma.poll.create({
    data: {
      title,
      type: pollType,
      tournamentId: tournament.id,
      options: {
        create: optionData.map((o) => ({
          label: o.label,
          teamId: o.teamId || null,
          playerId: o.playerId || null,
        })),
      },
    },
    include: {
      options: {
        include: { _count: { select: { votes: true } } },
      },
    },
  });

  return NextResponse.json({ poll }, { status: 201 });
}
