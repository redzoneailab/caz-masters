import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TOURNAMENT } from "@/lib/tournament";

export async function POST(req: NextRequest) {
  const { name, email, numGuests } = await req.json();

  if (!name || !email || !numGuests) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (numGuests < 1 || numGuests > 20) {
    return NextResponse.json({ error: "Invalid number of guests" }, { status: 400 });
  }

  // Check for existing registration
  const existing = await prisma.afterPartyRegistration.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "This email is already registered for the after party" }, { status: 400 });
  }

  // Check if this person is a tournament player
  const player = await prisma.player.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      tournament: { year: TOURNAMENT.year },
    },
  });

  const registration = await prisma.afterPartyRegistration.create({
    data: {
      name,
      email,
      numGuests,
      totalAmount: 0, // Price TBD — will be updated when finalized
      paymentMethod: "at_door",
      paymentStatus: "unpaid",
      playerId: player?.id || null,
    },
  });

  return NextResponse.json({ success: true, registrationId: registration.id });
}
