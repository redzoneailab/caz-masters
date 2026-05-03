import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function checkAuth(req: NextRequest) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  // Payment status update
  if (body.paymentStatus) {
    if (!["paid_online", "paid_manual", "unpaid"].includes(body.paymentStatus)) {
      return NextResponse.json({ error: "Invalid payment status" }, { status: 400 });
    }
    await prisma.payment.update({
      where: { playerId: id },
      data: {
        status: body.paymentStatus,
        method: body.paymentStatus === "paid_manual" ? "manual" : undefined,
      },
    });
  }

  // Player field updates
  const playerData: Record<string, unknown> = {};
  if (body.fullName !== undefined) playerData.fullName = body.fullName;
  if (body.email !== undefined) playerData.email = body.email;
  if (body.phone !== undefined) playerData.phone = body.phone;
  if (body.shirtSize !== undefined) playerData.shirtSize = body.shirtSize;
  if (body.genderFlight !== undefined) playerData.genderFlight = body.genderFlight;
  if (body.teamPreference !== undefined) playerData.teamPreference = body.teamPreference || null;
  if (body.dietaryNeeds !== undefined) playerData.dietaryNeeds = body.dietaryNeeds || null;
  if (body.teamId !== undefined) playerData.teamId = body.teamId || null;
  if (body.flaggedAsSpam !== undefined) playerData.flaggedAsSpam = !!body.flaggedAsSpam;

  if (Object.keys(playerData).length > 0) {
    await prisma.player.update({ where: { id }, data: playerData });
  }

  const player = await prisma.player.findUnique({
    where: { id },
    include: { payment: true, team: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ player });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Delete in FK-safe order
  await prisma.score.deleteMany({ where: { playerId: id } });
  await prisma.beerTab.deleteMany({ where: { playerId: id } });
  await prisma.payment.deleteMany({ where: { playerId: id } });
  await prisma.player.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
