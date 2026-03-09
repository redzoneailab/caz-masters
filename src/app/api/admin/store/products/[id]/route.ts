import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function checkAuth(req: NextRequest) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const data = await req.json();

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.price !== undefined) updateData.price = Math.round(data.price * 100);
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl || null;
  if (data.category !== undefined) updateData.category = data.category || null;
  if (data.active !== undefined) updateData.active = data.active;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

  const product = await prisma.product.update({
    where: { id },
    data: updateData,
    include: { variants: true },
  });

  return NextResponse.json({ product });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  // Check if product has orders
  const orderCount = await prisma.orderItem.count({ where: { productId: id } });
  if (orderCount > 0) {
    // Soft delete
    await prisma.product.update({ where: { id }, data: { active: false } });
  } else {
    await prisma.product.delete({ where: { id } });
  }

  return NextResponse.json({ success: true });
}
