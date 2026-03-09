import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const order = await prisma.storeOrder.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: { select: { name: true, imageUrl: true } },
          variant: { select: { label: true } },
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    order: {
      id: order.id,
      customerName: order.customerName,
      totalAmount: order.totalAmount,
      status: order.status,
      items: order.items.map((item) => ({
        name: item.product.name,
        variant: item.variant?.label,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      createdAt: order.createdAt,
    },
  });
}
