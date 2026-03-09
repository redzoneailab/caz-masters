import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function checkAuth(req: NextRequest) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const products = await prisma.product.findMany({
    include: {
      variants: { orderBy: { label: "asc" } },
      _count: { select: { orderItems: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description, price, imageUrl, category, variants } = await req.json();

  if (!name || !price) {
    return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      name,
      description: description || null,
      price: Math.round(price * 100),
      imageUrl: imageUrl || null,
      category: category || null,
      variants: {
        create: (variants as { label: string; stock: number }[] || []).map((v) => ({
          label: v.label,
          stock: v.stock || 0,
        })),
      },
    },
    include: { variants: true },
  });

  return NextResponse.json({ product });
}
