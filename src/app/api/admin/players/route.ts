import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TOURNAMENT } from "@/lib/tournament";

function checkAuth(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return false;
  }
  return true;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tournament = await prisma.tournament.findUnique({
    where: { year: TOURNAMENT.year },
    include: {
      players: {
        include: { payment: true, team: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return NextResponse.json({
    tournament,
    players: tournament?.players || [],
    count: tournament?.players.length || 0,
  });
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fullName, email, phone, shirtSize, genderFlight } = await req.json();

  if (!fullName || !email || !phone || !shirtSize || !genderFlight) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  let tournament = await prisma.tournament.findUnique({ where: { year: TOURNAMENT.year } });
  if (!tournament) {
    tournament = await prisma.tournament.create({
      data: {
        name: TOURNAMENT.name,
        year: TOURNAMENT.year,
        date: TOURNAMENT.date,
        location: TOURNAMENT.location,
        maxPlayers: TOURNAMENT.maxPlayers,
        entryFee: TOURNAMENT.entryFeeCents,
      },
    });
  }

  const existing = await prisma.player.findUnique({
    where: { email_tournamentId: { email, tournamentId: tournament.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 400 });
  }

  const existingAccount = await prisma.userAccount.findUnique({
    where: { email },
    select: { id: true },
  });

  const player = await prisma.player.create({
    data: {
      fullName,
      email,
      phone,
      shirtSize,
      genderFlight,
      tournamentId: tournament.id,
      ...(existingAccount && { userAccountId: existingAccount.id }),
    },
  });

  await prisma.payment.create({
    data: {
      playerId: player.id,
      amount: tournament.entryFee,
      status: "unpaid",
      method: "manual",
    },
  });

  return NextResponse.json({ player }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  if (url.searchParams.get("scope") !== "flagged") {
    return NextResponse.json({ error: "Missing or invalid scope" }, { status: 400 });
  }

  const flagged = await prisma.player.findMany({
    where: { flaggedAsSpam: true },
    select: { id: true },
  });
  const ids = flagged.map((p) => p.id);

  if (ids.length === 0) {
    return NextResponse.json({ deleted: 0 });
  }

  // Delete in FK-safe order
  await prisma.score.deleteMany({ where: { playerId: { in: ids } } });
  await prisma.beerTab.deleteMany({ where: { playerId: { in: ids } } });
  await prisma.payment.deleteMany({ where: { playerId: { in: ids } } });
  await prisma.afterPartyRegistration.deleteMany({ where: { playerId: { in: ids } } });
  await prisma.player.deleteMany({ where: { id: { in: ids } } });

  return NextResponse.json({ deleted: ids.length });
}
