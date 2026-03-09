import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function checkAuth(req: NextRequest) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.storeOrder.findMany({
    include: {
      items: {
        include: {
          product: { select: { name: true } },
          variant: { select: { label: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    totalOrders: orders.length,
    paidOrders: orders.filter((o) => o.status === "paid" || o.status === "fulfilled").length,
    fulfilledOrders: orders.filter((o) => o.status === "fulfilled").length,
    totalRevenue: orders
      .filter((o) => o.status === "paid" || o.status === "fulfilled")
      .reduce((sum, o) => sum + o.totalAmount, 0),
  };

  return NextResponse.json({ orders, stats });
}
