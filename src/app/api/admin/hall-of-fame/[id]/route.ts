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

  const data: Record<string, unknown> = {};
  if (body.year) data.year = parseInt(body.year);
  if (body.category) data.category = body.category;
  if (body.winnerName) data.winnerName = body.winnerName;
  if (body.teamName !== undefined) data.teamName = body.teamName || null;
  if (body.description !== undefined) data.description = body.description || null;

  const entry = await prisma.hallOfFameEntry.update({ where: { id }, data });
  return NextResponse.json({ entry });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.hallOfFameEntry.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
