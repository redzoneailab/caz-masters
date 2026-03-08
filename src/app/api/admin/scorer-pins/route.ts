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
    return NextResponse.json({ pins: [] });
  }

  const pins = await prisma.scorerPin.findMany({
    where: { tournamentId: tournament.id },
    include: {
      player: {
        select: { id: true, fullName: true, teamId: true, team: { select: { name: true } } },
      },
    },
  });

  return NextResponse.json({ pins, tournamentId: tournament.id });
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { playerId, pin, tournamentId } = await req.json();

  if (!playerId || !pin || pin.length < 4) {
    return NextResponse.json({ error: "Player ID and 4+ digit PIN required" }, { status: 400 });
  }

  const scorerPin = await prisma.scorerPin.upsert({
    where: { playerId },
    update: { pin },
    create: { playerId, pin, tournamentId },
  });

  return NextResponse.json({ scorerPin }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  await prisma.scorerPin.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
