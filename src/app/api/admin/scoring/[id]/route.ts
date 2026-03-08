import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function checkAuth(req: NextRequest) {
  return req.headers.get("authorization") === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

// Admin override a score
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
  if (typeof body.strokes === "number") data.strokes = body.strokes;
  if (typeof body.shotgunBeer === "boolean") data.shotgunBeer = body.shotgunBeer;
  if (typeof body.rehit === "boolean") data.rehit = body.rehit;

  const score = await prisma.score.update({ where: { id }, data });
  return NextResponse.json({ score });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.score.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
