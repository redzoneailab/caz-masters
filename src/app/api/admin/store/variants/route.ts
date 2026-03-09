import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function checkAuth(req: NextRequest) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId, label, stock } = await req.json();

  if (!productId || !label) {
    return NextResponse.json({ error: "Product ID and label are required" }, { status: 400 });
  }

  const variant = await prisma.productVariant.create({
    data: { productId, label, stock: stock || 0 },
  });

  return NextResponse.json({ variant });
}
