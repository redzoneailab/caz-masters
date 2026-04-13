import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TOURNAMENT } from "@/lib/tournament";

function checkAuth(req: NextRequest) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { confirm } = await req.json();
  if (confirm !== "RESET") {
    return NextResponse.json({ error: "Confirmation required: send { confirm: \"RESET\" }" }, { status: 400 });
  }

  const tournament = await prisma.tournament.findUnique({
    where: { year: TOURNAMENT.year },
  });

  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  // Delete in order to respect FK constraints (no cascades on Player)
  // 1. Delete votes (via poll options for this tournament's polls)
  await prisma.vote.deleteMany({
    where: { option: { poll: { tournamentId: tournament.id } } },
  });

  // 2. Delete scores
  await prisma.score.deleteMany({
    where: { tournamentId: tournament.id },
  });

  // 3. Delete beer tabs
  await prisma.beerTab.deleteMany({
    where: { tournamentId: tournament.id },
  });

  // 4. Delete payments (linked to players)
  await prisma.payment.deleteMany({
    where: { player: { tournamentId: tournament.id } },
  });

  // 5. Delete all after party registrations
  await prisma.afterPartyRegistration.deleteMany({});

  // 6. Delete players (this also clears team memberships)
  await prisma.player.deleteMany({
    where: { tournamentId: tournament.id },
  });

  // 7. Delete teams
  await prisma.team.deleteMany({
    where: { tournamentId: tournament.id },
  });

  // 8. Reset tournament state
  await prisma.tournament.update({
    where: { id: tournament.id },
    data: {
      registrationOpen: true,
      teamsLocked: false,
      finalized: false,
    },
  });

  return NextResponse.json({
    success: true,
    message: "Tournament data reset. Configuration, course, Hall of Fame, gallery, store, and poll configs preserved.",
  });
}
