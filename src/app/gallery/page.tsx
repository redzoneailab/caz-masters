import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata = {
  title: "Photo Gallery | The Caz Masters",
  description: "Photos from past Caz Masters tournaments.",
};

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const albums = await prisma.galleryAlbum.findMany({
    include: { _count: { select: { photos: true } } },
    orderBy: [{ year: "desc" }, { title: "asc" }],
  });

  const byYear = albums.reduce<Record<number, typeof albums>>((acc, album) => {
    if (!acc[album.year]) acc[album.year] = [];
    acc[album.year].push(album);
    return acc;
  }, {});

  const years = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <>
      <section className="bg-navy-950 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl font-black uppercase tracking-tight">Photo Gallery</h1>
          <p className="mt-3 text-navy-300 max-w-2xl mx-auto">
            Relive the memories from every year of The Caz Masters.
          </p>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {years.length === 0 ? (
            <p className="text-center text-navy-400 py-12">
              Photos coming soon. Check back after the admin uploads tournament photos.
            </p>
          ) : (
            <div className="space-y-12">
              {years.map((year) => (
                <div key={year}>
                  <h2 className="text-2xl font-bold text-navy-900 mb-4">{year}</h2>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {byYear[year].map((album) => (
                      <Link
                        key={album.id}
                        href={`/gallery/${album.id}`}
                        className="group block rounded-xl overflow-hidden border border-navy-100 hover:border-gold-300 transition-colors"
                      >
                        <div className="aspect-[4/3] bg-navy-100 relative">
                          {album.coverUrl ? (
                            <img
                              src={album.coverUrl}
                              alt={album.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-navy-300">
                              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-navy-900 group-hover:text-gold-500 transition-colors">
                            {album.title}
                          </h3>
                          {album.description && (
                            <p className="text-sm text-navy-500 mt-1 line-clamp-2">{album.description}</p>
                          )}
                          <p className="text-xs text-navy-400 mt-2">
                            {album._count.photos} photo{album._count.photos !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
