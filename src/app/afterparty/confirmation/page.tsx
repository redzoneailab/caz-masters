import Link from "next/link";
import { TOURNAMENT } from "@/lib/tournament";

export const metadata = {
  title: "Registered! — After Party",
};

export default function AfterPartyConfirmationPage() {
  return (
    <>
      <section className="bg-navy-950 text-white py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-16 h-16 bg-gold-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-navy-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight">You&apos;re In!</h1>
          <p className="mt-3 text-navy-300">
            Payment confirmed. See you at the party.
          </p>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-lg mx-auto px-4 sm:px-6">
          <div className="bg-navy-50 rounded-xl p-6 text-center space-y-3">
            <p className="text-navy-700">
              <span className="font-semibold">{TOURNAMENT.afterPartyVenue}</span>
            </p>
            <p className="text-navy-600">
              {TOURNAMENT.afterPartyDate} at {TOURNAMENT.afterPartyTime}
            </p>
            <div className="pt-2">
              {TOURNAMENT.afterPartyIncludes.map((item) => (
                <span key={item} className="inline-block bg-white text-navy-700 text-sm font-medium px-3 py-1 rounded-full m-1 border border-navy-200">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-block bg-navy-800 hover:bg-navy-900 text-white font-bold px-6 py-3 rounded-lg transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
