import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TOURNAMENT } from "@/lib/tournament";

function checkAuth(req: NextRequest) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (typeof body.registrationOpen === "boolean") data.registrationOpen = body.registrationOpen;
  if (typeof body.freeRegistration === "boolean") data.freeRegistration = body.freeRegistration;
  if (typeof body.entryFee === "number") data.entryFee = body.entryFee;
  if (typeof body.shotgunStart === "boolean") data.shotgunStart = body.shotgunStart;
  if (body.teeAssignments !== undefined) data.teeAssignments = body.teeAssignments;
  if (typeof body.scorerPin === "string") data.scorerPin = body.scorerPin || null;

  const tournament = await prisma.tournament.update({
    where: { year: TOURNAMENT.year },
    data,
  });

  return NextResponse.json({ tournament });
}
