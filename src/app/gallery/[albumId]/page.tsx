import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import AlbumViewer from "./AlbumViewer";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ albumId: string }> }) {
  const { albumId } = await params;
  const album = await prisma.galleryAlbum.findUnique({ where: { id: albumId } });
  return {
    title: album ? `${album.title} | Gallery | The Caz Masters` : "Album Not Found",
  };
}

export default async function AlbumPage({ params }: { params: Promise<{ albumId: string }> }) {
  const { albumId } = await params;
  const album = await prisma.galleryAlbum.findUnique({
    where: { id: albumId },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!album) notFound();

  return (
    <>
      <section className="bg-navy-950 text-white py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <Link
            href="/gallery"
            className="text-navy-400 hover:text-white text-sm transition-colors inline-flex items-center gap-1 mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Gallery
          </Link>
          <h1 className="text-3xl font-black uppercase tracking-tight">{album.title}</h1>
          <p className="text-navy-300 mt-1">{album.year}</p>
          {album.description && <p className="text-navy-400 mt-2">{album.description}</p>}
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {album.photos.length === 0 ? (
            <p className="text-center text-navy-400 py-12">No photos in this album yet.</p>
          ) : (
            <AlbumViewer
              photos={album.photos.map((p) => ({
                id: p.id,
                url: p.url,
                caption: p.caption,
              }))}
            />
          )}
        </div>
      </section>
    </>
  );
}
