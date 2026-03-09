import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | The Caz Masters",
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
                  with cold beers and a reason to play. The Caz Masters started in 2012 as
                  a casual round and quickly became the thing everyone looks forward to all year.
                </p>
                <p>
                  What began as a dozen buddies at Cazenovia Golf Club has grown into a full
                  72-player field &mdash; with teams, prizes, traditions, and a signature rule
                  that separates us from every other tournament on the planet.
                </p>
                <p>
                  We&apos;ve raised thousands for local charities along the way. Not bad for a
                  bunch of guys who started this as an excuse to day-drink on a golf course.
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

      {/* Caz Cares */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-black text-navy-900 uppercase mb-6">
              Caz Cares
            </h2>
            <p className="text-navy-600 text-lg leading-relaxed mb-4">
              More than a tournament. Every entry fee, every donation, every merch purchase
              goes directly toward supporting local causes in the Cazenovia community. Youth
              sports, families in need, and community programs that make this town what it is.
            </p>
            <p className="text-navy-600 text-lg leading-relaxed">
              Over 14 years, we&apos;ve raised thousands for the people and places that matter
              most. The Caz Masters proves you can have a hell of a time and do some real good
              while you&apos;re at it.
            </p>
            <Link
              href="/donate"
              className="inline-block mt-8 bg-gold-400 hover:bg-gold-300 text-navy-950 font-black px-8 py-3 rounded-xl transition-colors uppercase tracking-wider"
            >
              Support Caz Cares
            </Link>
          </div>
        </div>
      </section>

      {/* Hall of Champions */}
      <section className="py-16 sm:py-24 bg-navy-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-black text-center uppercase mb-4">
            Hall of Fame
          </h2>
          <p className="text-center text-navy-300 mb-12 text-lg">
            Legends of the game. Or at least legends of this game.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { src: "/images/champion-2015.png", label: "2015 Champion" },
              { src: "/images/champion-2016.jpg", label: "2016 Champion" },
              { src: "/images/champion-2017.png", label: "2017 Champion" },
              { src: "/images/champion-2018.png", label: "2018 Champion" },
              { src: "/images/team-winner-2019.jpg", label: "2019 Team Champs" },
              { src: "/images/new-champ.jpg", label: "Reigning Champion" },
            ].map((champ) => (
              <div key={champ.src}>
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-navy-600 group">
                  <Image
                    src={champ.src}
                    alt={champ.label}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <p className="text-gold-400 font-bold text-lg text-center mt-3">{champ.label}</p>
              </div>
            ))}
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
            15th anniversary. 72 spots. Don&apos;t miss this one.
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
