import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function checkAuth(req: NextRequest) {
  return req.headers.get("authorization") === `Bearer ${process.env.ADMIN_PASSWORD}`;
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

  // Update hole-level fields (active, notes)
  const holeData: Record<string, unknown> = {};
  if (typeof body.active === "boolean") holeData.active = body.active;
  if (body.notes !== undefined) holeData.notes = body.notes || null;

  if (Object.keys(holeData).length > 0) {
    await prisma.courseHole.update({ where: { id }, data: holeData });
  }

  // Update tee boxes
  if (Array.isArray(body.teeBoxes)) {
    for (const tb of body.teeBoxes) {
      const tbData: Record<string, unknown> = {};
      if (typeof tb.par === "number") tbData.par = tb.par;
      if (typeof tb.yardage === "number") tbData.yardage = tb.yardage;
      if (tb.yardage === null) tbData.yardage = null;
      if (Object.keys(tbData).length > 0) {
        await prisma.teeBox.update({ where: { id: tb.id }, data: tbData });
      }
    }
  }

  const hole = await prisma.courseHole.findUnique({
    where: { id },
    include: { teeBoxes: { orderBy: { name: "asc" } } },
  });

  return NextResponse.json({ hole });
}
