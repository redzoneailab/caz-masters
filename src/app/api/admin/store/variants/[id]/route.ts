import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function checkAuth(req: NextRequest) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { stock, label } = await req.json();

  const updateData: Record<string, unknown> = {};
  if (stock !== undefined) updateData.stock = stock;
  if (label !== undefined) updateData.label = label;

  const variant = await prisma.productVariant.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ variant });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  await prisma.productVariant.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
