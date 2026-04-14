import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "The story of The Caz Masters charity golf tournament — 15 years of golf, beers, and giving back.",
};

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center text-white overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/group-2018.jpg"
            alt="The Caz Masters crew"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-navy-950/70" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center py-20">
          <h1 className="text-5xl sm:text-7xl font-black uppercase mb-4">The Story</h1>
          <p className="text-xl text-white/80 italic font-light">
            15 years of golf, beers, and giving back.
          </p>
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-16 sm:py-24 bg-[#F0F4F8]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-center">
            <div className="md:col-span-3">
              <h2 className="text-3xl sm:text-4xl font-black text-navy-900 uppercase mb-6">
                How It Started
              </h2>
              <div className="space-y-4 text-navy-600 text-lg leading-relaxed">
                <p>
                  A group of friends. A holiday weekend. A shared belief that golf is better
                  with cold beers and something on the line. The Caz Masters started in 2012 as
                  a casual round and quickly became the thing everyone looks forward to all year.
                </p>
                <p>
                  What began as a dozen buddies at whatever course would have us, has grown
                  into a full 72-player field, with teams, prizes, traditions, and a signature
                  rule that set the foundation for the legacy that is The Caz Masters.
                </p>
                <p>
                  We&apos;ve raised tens of thousands for local charities along the way. Not bad
                  for a few fun afternoons on the links.
                </p>
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/jacket-handoff-2019.jpg"
                  alt="The jacket handoff"
                  fill
                  className="object-cover"
                />
              </div>
              <p className="text-navy-400 text-sm mt-3 text-center italic">The passing of the torch</p>
            </div>
          </div>
        </div>
      </section>

      {/* Photo Gallery Preview */}
      <section className="py-16 sm:py-24 bg-navy-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-black text-center uppercase mb-4">
            Through the Years
          </h2>
          <p className="text-center text-navy-300 mb-12 text-lg">
            14 years of traditions, triumphs, and questionable fashion choices.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { src: "/images/champion-2014.png", label: "2014" },
              { src: "/images/champion-2015.jpg", label: "2015" },
              { src: "/images/champion-2016.png", label: "2016" },
              { src: "/images/champion-2017.png", label: "2017" },
              { src: "/images/team-winner-2018.jpg", label: "2018" },
              { src: "/images/group-2018.jpg", label: "The Crew" },
            ].map((photo) => (
              <div key={photo.src} className="group">
                <div className="relative aspect-square rounded-xl overflow-hidden border border-navy-600">
                  <Image
                    src={photo.src}
                    alt={photo.label}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <p className="absolute bottom-2 left-3 text-white/90 font-bold text-sm">{photo.label}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/gallery"
              className="inline-block bg-gold-400 hover:bg-gold-300 text-navy-950 font-black px-8 py-3 rounded-xl transition-colors uppercase tracking-wider"
            >
              View All Photos
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative text-white text-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/fore-america.jpg"
            alt="FORE AMERICA"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-navy-950/75" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-20 sm:py-32">
          <h2 className="text-4xl sm:text-6xl font-black mb-6 uppercase">Your Turn</h2>
          <p className="text-xl text-white/80 mb-10 font-light">
            14th anniversary. 72 spots. Don&apos;t miss this one.
          </p>
          <Link
            href="/register"
            className="inline-block bg-gold-400 hover:bg-gold-300 text-navy-950 font-black text-xl px-10 py-5 rounded-xl transition-all hover:scale-105 shadow-2xl uppercase tracking-wide"
          >
            Register Now
          </Link>
        </div>
      </section>
    </>
  );
}
