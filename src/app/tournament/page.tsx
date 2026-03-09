import Link from "next/link";
import type { Metadata } from "next";
import { TOURNAMENT } from "@/lib/tournament";

export const metadata: Metadata = {
  title: "Tournament Details | The Caz Masters",
  description: "Everything you need to know about The Caz Masters — format, rules, course, prizes, and after party.",
};

export default function TournamentPage() {
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
            <div className="bg-navy-900 border border-navy-700 rounded-lg px-5 py-3">
              <p className="text-navy-400">Entry Fee</p>
              <p className="text-white font-bold">${TOURNAMENT.entryFee}</p>
            </div>
            <div className="bg-navy-900 border border-navy-700 rounded-lg px-5 py-3">
              <p className="text-navy-400">Field</p>
              <p className="text-white font-bold">{TOURNAMENT.maxPlayers} players</p>
            </div>
          </div>
        </div>
      </section>

      {/* Scoring Format */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-black text-navy-900 uppercase mb-8 text-center">
            Scoring Format
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-navy-50 rounded-2xl p-8">
              <h3 className="text-xl font-black text-navy-900 uppercase mb-4">Modified Stableford</h3>
              <p className="text-navy-600 leading-relaxed mb-4">
                Points-based scoring. You earn points for pars, birdies, and better &mdash; and
                you don&apos;t have to finish a bad hole. Pick up and move on. Keeps things moving
                and means one blow-up hole doesn&apos;t ruin your day.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1.5 border-b border-navy-200">
                  <span className="text-navy-700 font-medium">Eagle or Better</span>
                  <span className="text-navy-900 font-bold">5 points</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-navy-200">
                  <span className="text-navy-700 font-medium">Birdie</span>
                  <span className="text-navy-900 font-bold">3 points</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-navy-200">
                  <span className="text-navy-700 font-medium">Par</span>
                  <span className="text-navy-900 font-bold">2 points</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-navy-200">
                  <span className="text-navy-700 font-medium">Bogey</span>
                  <span className="text-navy-900 font-bold">1 point</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-navy-700 font-medium">Double Bogey+</span>
                  <span className="text-navy-900 font-bold">0 points</span>
                </div>
              </div>
            </div>

            <div className="bg-navy-50 rounded-2xl p-8">
              <h3 className="text-xl font-black text-navy-900 uppercase mb-4">Team Scoring</h3>
              <p className="text-navy-600 leading-relaxed mb-4">
                Teams of 5. On each hole, the median score is dropped and the remaining
                4 Stableford scores count toward the team total. This keeps it competitive
                without punishing one player&apos;s rough hole.
              </p>
              <div className="bg-white rounded-xl p-4 border border-navy-200">
                <p className="text-sm font-semibold text-navy-700 mb-2">Example: Hole 7</p>
                <div className="space-y-1 text-sm text-navy-600">
                  <p>Player A: Par (2 pts) &middot; Player B: Birdie (3 pts)</p>
                  <p>Player C: Bogey (1 pt) &middot; <span className="line-through text-navy-400">Player D: Bogey (1 pt)</span></p>
                  <p>Player E: Par (2 pts)</p>
                  <p className="font-bold text-navy-900 pt-1">Team score: 8 points (drop median)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rules & Traditions */}
      <section className="py-16 bg-navy-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-black text-navy-900 uppercase mb-8 text-center">
            Rules &amp; Traditions
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-navy-100">
              <div className="w-12 h-12 rounded-xl bg-gold-400/10 flex items-center justify-center mb-4">
                <span className="text-2xl">&#127866;</span>
              </div>
              <h3 className="text-lg font-bold text-navy-900 mb-2">Shotgun Beers</h3>
              <p className="text-navy-600 text-sm leading-relaxed">
                The signature move. Shotgun a beer on any hole for a ${TOURNAMENT.shotgunBeerPrice} donation
                to Caz Cares. It&apos;s not mandatory. But legends are made here.
                Tracked on the live scoreboard.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-navy-100">
              <div className="w-12 h-12 rounded-xl bg-gold-400/10 flex items-center justify-center mb-4">
                <span className="text-2xl">&#128260;</span>
              </div>
              <h3 className="text-lg font-bold text-navy-900 mb-2">Rehits</h3>
              <p className="text-navy-600 text-sm leading-relaxed">
                Bad tee shot? Take a rehit. You get one per 9 holes. Use it wisely.
                Rehits are tracked in the scoring system so your team knows
                what you&apos;ve got left.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-navy-100">
              <div className="w-12 h-12 rounded-xl bg-gold-400/10 flex items-center justify-center mb-4">
                <span className="text-2xl">&#128163;</span>
              </div>
              <h3 className="text-lg font-bold text-navy-900 mb-2">Shotgun Start</h3>
              <p className="text-navy-600 text-sm leading-relaxed">
                All teams start at the same time on different holes. This means
                everyone finishes together &mdash; just in time for
                the awards and after party.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-navy-100">
              <div className="w-12 h-12 rounded-xl bg-gold-400/10 flex items-center justify-center mb-4">
                <span className="text-2xl">&#9971;</span>
              </div>
              <h3 className="text-lg font-bold text-navy-900 mb-2">The Course</h3>
              <p className="text-navy-600 text-sm leading-relaxed">
                Cazenovia Golf Club is a 9-hole course played as 18. Second time around
                you play from different tees, so it&apos;s a fresh challenge every nine.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-navy-100">
              <div className="w-12 h-12 rounded-xl bg-gold-400/10 flex items-center justify-center mb-4">
                <span className="text-2xl">&#128101;</span>
              </div>
              <h3 className="text-lg font-bold text-navy-900 mb-2">Flights</h3>
              <p className="text-navy-600 text-sm leading-relaxed">
                Men&apos;s and Women&apos;s flights with separate tee boxes. Men play
                White tees (front 9) and Red tees (back 9). Women play Yellow tees
                for all 18. Everyone competes on fair ground.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-navy-100">
              <div className="w-12 h-12 rounded-xl bg-gold-400/10 flex items-center justify-center mb-4">
                <span className="text-2xl">&#128241;</span>
              </div>
              <h3 className="text-lg font-bold text-navy-900 mb-2">Live Scoring</h3>
              <p className="text-navy-600 text-sm leading-relaxed">
                Scores are entered in real time by each team&apos;s scorer. Watch the
                leaderboard update live from anywhere. Works offline too &mdash;
                scores sync when signal returns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Prizes */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-black text-navy-900 uppercase mb-8 text-center">
            Prizes &amp; Awards
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: "1st Place Team", desc: "The Green Jacket. Glory forever." },
              { title: "2nd & 3rd Place Teams", desc: "Respect. And probably a bar tab." },
              { title: "Individual Low Score", desc: "Best individual Stableford total" },
              { title: "Longest Drive", desc: "Measured on a designated hole" },
              { title: "Closest to the Pin", desc: "Par 3 precision" },
              { title: "Best Dressed Team", desc: "Costumes encouraged. Judged by the people." },
              { title: "Most Shotguns", desc: "For the truly committed" },
              { title: "A Few Surprises", desc: "Some awards are earned. Some are bestowed." },
            ].map((prize) => (
              <div key={prize.title} className="flex gap-3 py-3 border-b border-navy-100 last:border-0">
                <span className="w-2 h-2 rounded-full bg-gold-400 mt-2 shrink-0" />
                <div>
                  <p className="font-bold text-navy-900">{prize.title}</p>
                  <p className="text-sm text-navy-500">{prize.desc}</p>
                </div>
              </div>
            ))}
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
                    <p className="text-navy-300">{TOURNAMENT.afterPartyDate} at {TOURNAMENT.afterPartyTime}</p>
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
            72 spots. ${TOURNAMENT.entryFee} entry. All proceeds go to Caz Cares.
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
