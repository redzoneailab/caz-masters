import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function checkAuth(req: NextRequest) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

// Update team (lock/unlock, maxSize, move player)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  // Move a player to this team (or to free agents if id === "free-agents")
  if (body.movePlayerId) {
    await prisma.player.update({
      where: { id: body.movePlayerId },
      data: { teamId: id === "free-agents" ? null : id },
    });
    return NextResponse.json({ success: true });
  }

  // Update team properties
  const data: Record<string, unknown> = {};
  if (typeof body.locked === "boolean") data.locked = body.locked;
  if (typeof body.maxSize === "number") data.maxSize = body.maxSize;
  if (typeof body.startingHole === "number" || body.startingHole === null) data.startingHole = body.startingHole;
  if (body.unlockScorer === true) {
    data.activeScorerName = null;
    data.activeScorerKey = null;
  }

  await prisma.team.update({ where: { id }, data });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Unassign all members first
  await prisma.player.updateMany({
    where: { teamId: id },
    data: { teamId: null },
  });

  await prisma.team.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
