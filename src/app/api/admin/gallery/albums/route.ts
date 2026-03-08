import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function checkAuth(req: NextRequest) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const albums = await prisma.galleryAlbum.findMany({
    include: { _count: { select: { photos: true } } },
    orderBy: [{ year: "desc" }, { title: "asc" }],
  });

  return NextResponse.json({ albums });
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { year, title, description, coverUrl } = await req.json();

  if (!year || !title) {
    return NextResponse.json({ error: "Year and title are required" }, { status: 400 });
  }

  const album = await prisma.galleryAlbum.create({
    data: {
      year: parseInt(year),
      title,
      description: description || null,
      coverUrl: coverUrl || null,
    },
  });

  return NextResponse.json({ album }, { status: 201 });
}
