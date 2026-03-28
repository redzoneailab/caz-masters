import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Photo Gallery | The Caz Masters",
  description: "Photos from all 15 years of The Caz Masters — browse, download, and share.",
};

export const dynamic = "force-dynamic";

const DRIVE_URL = "https://drive.google.com/drive/folders/1dtg69-rTD89a8chqdhxqlztsQMTUnxoU";

const PREVIEW_IMAGES = [
  { src: "/images/champion-2018.png", alt: "2018 Champion" },
  { src: "/images/group-2018.jpg", alt: "Group photo 2018" },
  { src: "/images/jacket-handoff-2019.jpg", alt: "Green jacket handoff 2019" },
  { src: "/images/guys-dudes-1.jpg", alt: "The guys" },
  { src: "/images/fore-america.jpg", alt: "Fore America" },
  { src: "/images/team-winner-2019.jpg", alt: "Team winners 2019" },
  { src: "/images/champion-2017.png", alt: "2017 Champion" },
  { src: "/images/broiler.jpg", alt: "On the course" },
  { src: "/images/ultimate-power.jpg", alt: "Ultimate power" },
];

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
      {/* Hero */}
      <section className="bg-navy-950 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl font-black uppercase tracking-tight">Photo Gallery</h1>
          <p className="mt-3 text-navy-300 max-w-2xl mx-auto">
            Photos from all 15 years of The Caz Masters &mdash; browse, download, and share.
          </p>
        </div>
      </section>

      {/* Preview grid + Drive link */}
      <section className="py-12 bg-navy-950 border-t border-navy-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 gap-2 sm:gap-3">
            {PREVIEW_IMAGES.map((img) => (
              <a
                key={img.src}
                href={DRIVE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square rounded-lg overflow-hidden"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 33vw, (max-width: 768px) 33vw, 220px"
                />
                <div className="absolute inset-0 bg-navy-950/0 group-hover:bg-navy-950/30 transition-colors" />
              </a>
            ))}
          </div>

          <div className="text-center mt-10">
            <a
              href={DRIVE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-gold-400 hover:bg-gold-300 text-navy-950 font-black px-8 py-4 rounded-xl text-lg uppercase tracking-wider transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              View All Photos
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <p className="text-navy-400 text-sm mt-4">
              Opens our Google Drive folder with every tournament photo ever taken.
            </p>
          </div>
        </div>
      </section>

      {/* Database albums (if any) */}
      {years.length > 0 && (
        <section className="py-12 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-navy-900 mb-8 text-center">Albums</h2>
            <div className="space-y-12">
              {years.map((year) => (
                <div key={year}>
                  <h3 className="text-xl font-bold text-navy-900 mb-4">{year}</h3>
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
                          <h4 className="font-semibold text-navy-900 group-hover:text-gold-500 transition-colors">
                            {album.title}
                          </h4>
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
          </div>
        </section>
      )}
    </>
  );
}
