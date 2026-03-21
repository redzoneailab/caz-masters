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
  if (typeof body.shotgunStart === "boolean") data.shotgunStart = body.shotgunStart;

  const tournament = await prisma.tournament.update({
    where: { year: TOURNAMENT.year },
    data,
  });

  return NextResponse.json({ tournament });
}
