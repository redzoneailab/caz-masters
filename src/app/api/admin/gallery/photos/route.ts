import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function checkAuth(req: NextRequest) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

// Bulk add photos to an album
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { albumId, photos } = await req.json();

  if (!albumId || !photos?.length) {
    return NextResponse.json({ error: "Album ID and photos are required" }, { status: 400 });
  }

  const album = await prisma.galleryAlbum.findUnique({ where: { id: albumId } });
  if (!album) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  const currentCount = await prisma.galleryPhoto.count({ where: { albumId } });

  const created = await prisma.galleryPhoto.createMany({
    data: photos.map((photo: { url: string; caption?: string }, index: number) => ({
      albumId,
      url: photo.url,
      caption: photo.caption || null,
      sortOrder: currentCount + index,
    })),
  });

  // Set cover if album doesn't have one
  if (!album.coverUrl && photos[0]?.url) {
    await prisma.galleryAlbum.update({
      where: { id: albumId },
      data: { coverUrl: photos[0].url },
    });
  }

  return NextResponse.json({ count: created.count }, { status: 201 });
}
