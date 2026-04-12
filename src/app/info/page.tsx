import Link from "next/link";
import type { Metadata } from "next";
import { TOURNAMENT } from "@/lib/tournament";
import { getTournamentSettings } from "@/lib/tournament-settings";

export const metadata: Metadata = {
  title: "Information",
  description: "Everything you need to know about The Caz Masters — format, rules, course, prizes, and after party.",
};

export const dynamic = "force-dynamic";

export default async function InfoPage() {
  const { freeRegistration, entryFee } = await getTournamentSettings();

  return (
    <>
      {/* Hero */}
      <section className="bg-navy-950 text-white py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-gold-400 font-bold text-sm uppercase tracking-widest mb-3">
            {TOURNAMENT.edition}
          </p>
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight">
            Tournament Details
          </h1>
          <p className="mt-4 text-navy-300 text-lg max-w-2xl mx-auto">
            Everything you need to know before you tee it up.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-8 text-sm">
            <div className="bg-navy-900 border border-navy-700 rounded-lg px-5 py-3">
              <p className="text-navy-400">When</p>
              <p className="text-white font-bold">{TOURNAMENT.dateDisplay}</p>
            </div>
            <div className="bg-navy-900 border border-navy-700 rounded-lg px-5 py-3">
              <p className="text-navy-400">Where</p>
              <p className="text-white font-bold">{TOURNAMENT.location}</p>
            </div>
            {!freeRegistration && (
              <div className="bg-navy-900 border border-navy-700 rounded-lg px-5 py-3">
                <p className="text-navy-400">Entry Fee</p>
                <p className="text-white font-bold">${entryFee}</p>
              </div>
            )}
            <div className="bg-navy-900 border border-navy-700 rounded-lg px-5 py-3">
              <p className="text-navy-400">Field</p>
              <p className="text-white font-bold">{TOURNAMENT.maxPlayers} players</p>
            </div>
          </div>
        </div>
      </section>

      {/* How We Score */}
      <section className="py-16 bg-navy-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <p className="text-gold-400 font-black text-sm uppercase tracking-[0.2em] text-center mb-10">
            How We Score
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Scoring */}
            <div className="bg-white rounded-2xl p-8 border-l-4 border-gold-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
              <h3 className="text-xl font-black text-gold-500 uppercase mb-4 flex items-center gap-2">
                <span>&#127942;</span> Scoring
              </h3>
              <p className="text-navy-600 leading-relaxed mb-5">
                Points for every hole &mdash; pick up and move on when it&apos;s not your hole.
              </p>
              <div className="space-y-2 text-sm">
                {[
                  { label: "Albatross+", pts: "5" },
                  { label: "Eagle", pts: "4" },
                  { label: "Birdie", pts: "3" },
                  { label: "Par", pts: "2" },
                  { label: "Bogey", pts: "1" },
                  { label: "Double+", pts: "0" },
                ].map((row, i, arr) => (
                  <div key={row.label} className={`flex justify-between py-1.5 ${i < arr.length - 1 ? "border-b border-navy-100" : ""}`}>
                    <span className="text-navy-700 font-medium">{row.label}</span>
                    <span className="text-navy-900 font-bold">{row.pts} pts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Scoring */}
            <div className="bg-white rounded-2xl p-8 border-l-4 border-gold-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
              <h3 className="text-xl font-black text-gold-500 uppercase mb-4 flex items-center gap-2">
                <span>&#128101;</span> Team Scoring
              </h3>
              <p className="text-navy-600 leading-relaxed mb-4">
                Teams of 4. Every player&apos;s Stableford score counts on every hole &mdash;
                no drops, no hiding. Highest team total wins.
              </p>
              <p className="text-navy-600 leading-relaxed mb-4">
                If your team scores birdie (3), par (2), par (2), bogey (1) on a hole,
                that&apos;s 8 team points.
              </p>
              <p className="text-navy-900 text-sm font-bold bg-navy-50 rounded-lg px-3 py-2">
                Teams of 5 drop the middle score on each hole.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Need to Know */}
      <section className="py-16 bg-[#F0F4F8]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <p className="text-gold-500 font-black text-sm uppercase tracking-[0.2em] text-center mb-10">
            Need to Know
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Shotgun Mulligans */}
            <div className="bg-white rounded-2xl p-8 border-l-4 border-gold-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
              <h3 className="text-xl font-black text-gold-500 uppercase mb-4 flex items-center gap-2">
                <span>&#127866;</span> Shotgun Mulligans
              </h3>
              <p className="text-navy-600 leading-relaxed">
                For ${TOURNAMENT.shotgunBeerPrice}, shotgun a beer and retake
                your shot. Any shot, any hole &mdash; excluding putts.
              </p>
            </div>

            {/* The Course */}
            <div className="bg-white rounded-2xl p-8 border-l-4 border-gold-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
              <h3 className="text-xl font-black text-gold-500 uppercase mb-4 flex items-center gap-2">
                <span>&#9971;</span> The Course
              </h3>
              <p className="text-navy-600 leading-relaxed">
                Established in 1896, Cazenovia Golf Club sits high above Cazenovia Lake with
                some of the best views in Central New York. The 9-hole course plays as a
                full 18 &mdash; white tees on the front, red tees on the back.
              </p>
            </div>

            {/* Prizes */}
            <div className="bg-white rounded-2xl p-8 border-l-4 border-gold-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
              <h3 className="text-xl font-black text-gold-500 uppercase mb-4 flex items-center gap-2">
                <span>&#127941;</span> Prizes
              </h3>
              <div className="space-y-2.5">
                {[
                  "The Gold Jacket (individual low score)",
                  "First Place Team",
                  "Longest Drive",
                  "Closest to the Pin",
                  "Best Dressed",
                  "Most Shotguns",
                ].map((prize) => (
                  <div key={prize} className="flex gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-400 mt-2 shrink-0" />
                    <p className="text-navy-600 text-sm">{prize}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* After Party */}
      <section className="py-16 bg-navy-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-black uppercase mb-8 text-center">
            The After Party
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <span className="w-2 h-2 rounded-full bg-gold-400 mt-2 shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Venue</p>
                    <p className="text-navy-300">{TOURNAMENT.afterPartyVenue}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="w-2 h-2 rounded-full bg-gold-400 mt-2 shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Date &amp; Time</p>
                    <p className="text-navy-300">{TOURNAMENT.afterPartyDate} &middot; {TOURNAMENT.afterPartyTime}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="w-2 h-2 rounded-full bg-gold-400 mt-2 shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Price</p>
                    <p className="text-navy-300">${TOURNAMENT.afterPartyPrice} per person</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-gold-400 uppercase tracking-wider mb-3">What&apos;s Included</p>
              <ul className="space-y-2">
                {TOURNAMENT.afterPartyIncludes.map((item) => (
                  <li key={item} className="flex gap-3 text-navy-200">
                    <span className="w-2 h-2 rounded-full bg-gold-400 mt-2 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-navy-400 text-sm mt-4">
                Open to everyone &mdash; players, family, and friends.
                Add it during registration or sign up separately at{" "}
                <Link href="/afterparty" className="text-gold-400 hover:text-gold-300 underline">
                  /afterparty
                </Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-navy-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-black text-navy-900 uppercase mb-4">Ready?</h2>
          <p className="text-navy-600 mb-8">
            {freeRegistration
              ? "72 spots. Lock yours in."
              : `72 spots. $${entryFee} entry. Lock yours in.`}
          </p>
          <Link
            href="/register"
            className="inline-block bg-gold-400 hover:bg-gold-300 text-navy-950 font-black text-lg px-10 py-4 rounded-xl transition-all hover:scale-105 shadow-lg uppercase tracking-wide"
          >
            Register Now
          </Link>
        </div>
      </section>
    </>
  );
}
