import Image from "next/image";
import Link from "next/link";
import CountdownTimer from "@/components/CountdownTimer";
import SpotsCounter from "@/components/SpotsCounter";
import { TOURNAMENT } from "@/lib/tournament";
import { getTournamentSettings } from "@/lib/tournament-settings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { freeRegistration, entryFee } = await getTournamentSettings();

  return (
    <>
      {/* Hero — tighter */}
      <section className="relative min-h-[70vh] flex items-center justify-center text-white overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/fore-america.jpg"
            alt="FORE AMERICA"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-navy-950/60 via-navy-950/50 to-navy-950/80" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center py-16">
          <p className="text-gold-400 font-bold tracking-[0.25em] uppercase text-sm sm:text-base mb-5">
            {TOURNAMENT.edition}
          </p>
          <h1 className="text-6xl sm:text-8xl font-black tracking-tight mb-3 uppercase">
            The Caz
            <br />
            Masters
          </h1>
          <p className="text-xl sm:text-2xl mb-2 font-light italic text-white/90">
            A Tradition Like All the Others
          </p>
          <p className="text-navy-300 text-lg mb-8">
            {TOURNAMENT.dateDisplay} &middot; {TOURNAMENT.location}
          </p>

          <div className="flex justify-center mb-8">
            <CountdownTimer />
          </div>

          <Link
            href="/register"
            className="inline-block bg-gold-400 hover:bg-gold-300 text-navy-950 font-black text-lg sm:text-xl px-10 py-5 rounded-xl transition-all hover:scale-105 shadow-2xl uppercase tracking-wide"
          >
            Let&apos;s Go
          </Link>
        </div>
      </section>

      {/* The Pitch — object-bottom so faces show */}
      <section className="relative py-28 sm:py-40 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/guys-dudes-1.jpg"
            alt="On the course"
            fill
            className="object-cover object-top"
          />
          <div className="absolute inset-0 bg-navy-950/65" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center text-white">
          <p className="text-2xl sm:text-4xl leading-relaxed text-white font-medium">
            Time to dust off the sticks and practice powering down some beers.
            18 holes of glory. All for charity. You know the deal.
          </p>
        </div>
      </section>

      {/* Quick Details — flat, no sub-text */}
      <section className="py-14 sm:py-18 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap justify-center gap-8 sm:gap-12 text-center">
            <div>
              <p className="text-gold-500 font-black text-sm tracking-[0.2em] uppercase mb-2">WHEN</p>
              <p className="text-xl sm:text-2xl font-bold text-navy-900">Friday, July 3rd, 2026</p>
            </div>
            <div>
              <p className="text-gold-500 font-black text-sm tracking-[0.2em] uppercase mb-2">WHERE</p>
              <p className="text-xl sm:text-2xl font-bold text-navy-900">Caz Golf Club, Cazenovia NY</p>
            </div>
            <SpotsCounter />
            {!freeRegistration && (
              <div>
                <p className="text-gold-500 font-black text-sm tracking-[0.2em] uppercase mb-2">COST</p>
                <p className="text-xl sm:text-2xl font-bold text-navy-900">${entryFee} All-In</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Photo Grid */}
      <section className="bg-navy-950 p-2">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {[
            { src: "/images/hero.jpg", alt: "Tournament action" },
            { src: "/images/broiler.jpg", alt: "The Broiler", position: "center 20%" },
            { src: "/images/knees-weak.jpg", alt: "Knees weak, arms are heavy" },
            { src: "/images/guys-dudes-3.jpg", alt: "The course" },
          ].map((img) => (
            <div key={img.src} className="relative aspect-[4/3] overflow-hidden rounded-lg">
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover hover:scale-105 transition-transform duration-500"
                style={img.position ? { objectPosition: img.position } : undefined}
              />
            </div>
          ))}
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-navy-900 uppercase mb-10">
            {freeRegistration ? "What You Get" : `Your $${entryFee} Gets You`}
          </h2>
          <div className="space-y-8 text-left">
            <div className="flex items-start gap-5">
              <span className="bg-gold-400 text-navy-900 font-black text-3xl w-14 h-14 rounded-xl flex items-center justify-center shrink-0">1</span>
              <div>
                <p className="text-navy-900 font-bold text-lg">Greens Fees</p>
                <p className="text-navy-500">18 holes with a cart at Cazenovia Golf Club. Show up and play.</p>
              </div>
            </div>
            <div className="flex items-start gap-5">
              <span className="bg-gold-400 text-navy-900 font-black text-3xl w-14 h-14 rounded-xl flex items-center justify-center shrink-0">2</span>
              <div>
                <p className="text-navy-900 font-bold text-lg">Tournament Entry + Charity Donation</p>
                <p className="text-navy-500">Prizes, contests, and a donation to Caz Cares. Feel good about yourself for once.</p>
              </div>
            </div>
            <div className="flex items-start gap-5">
              <span className="bg-gold-400 text-navy-900 font-black text-3xl w-14 h-14 rounded-xl flex items-center justify-center shrink-0">3</span>
              <div>
                <p className="text-navy-900 font-bold text-lg">Swag</p>
                <p className="text-navy-500">Tournament shirt and whatever else we throw at you. You&apos;ll look great.</p>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-8 border-t border-navy-100">
            <p className="text-navy-500 text-sm">
              Plus Snappy Griller dogs (the finest Syracuse has to offer), cold Labatts, and
              a post-round ceremony where we pretend to be Augusta for 20 minutes.
            </p>
          </div>
        </div>
      </section>

      {/* Big Group Photo */}
      <section className="relative h-[50vh] sm:h-[60vh]">
        <Image
          src="/images/group-2018.jpg"
          alt="The whole crew"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/50 to-transparent" />
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-white/70 text-sm font-light italic">The whole crew, 2018</p>
        </div>
      </section>

      {/* Dealer's Choice */}
      <section className="py-16 sm:py-20 bg-navy-950">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-gold-400 uppercase mb-4">
            Dealer&apos;s Choice
          </h2>
          <p className="text-xl text-white font-medium leading-relaxed">
            Hit a bad shot, crush a cold one, and reload a second chance. Add $5 to the pot.
          </p>
        </div>
      </section>

      {/* More photos */}
      <section className="bg-navy-950 py-1">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
          {[
            { src: "/images/cots.jpg", alt: "Tournament scene" },
            { src: "/images/new-champ.jpg", alt: "The champ" },
            { src: "/images/ultimate-power.jpg", alt: "Ultimate power" },
          ].map((img) => (
            <div key={img.src} className="relative aspect-[4/3] overflow-hidden">
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative text-white text-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/jacket-handoff-2019.jpg"
            alt="The jacket handoff"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-navy-950/75" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-20 sm:py-32">
          <h2 className="text-4xl sm:text-6xl font-black mb-4 uppercase">You In?</h2>
          <p className="text-xl text-white/80 mb-10 font-light">
            Don&apos;t be the one watching from the clubhouse.
          </p>
          <Link
            href="/register"
            className="inline-block bg-gold-400 hover:bg-gold-300 text-navy-950 font-black text-xl px-10 py-5 rounded-xl transition-all hover:scale-105 shadow-2xl uppercase tracking-wide"
          >
            Register Now
          </Link>
        </div>
      </section>

      {/* Tagline */}
      <section className="bg-navy-950 text-center py-4 border-t border-navy-800">
        <p className="text-navy-600 text-xs uppercase tracking-[0.2em]">
          Brought to You by The Dog
        </p>
      </section>
    </>
  );
}
