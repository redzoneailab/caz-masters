import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TOURNAMENT } from "@/lib/tournament";

export const revalidate = 30;

export async function GET() {
  const tournament = await prisma.tournament.findUnique({
    where: { year: TOURNAMENT.year },
    select: { freeRegistration: true, entryFee: true },
  });

  return NextResponse.json({
    freeRegistration: tournament?.freeRegistration ?? false,
    entryFee: tournament ? tournament.entryFee / 100 : TOURNAMENT.entryFee,
  });
}
