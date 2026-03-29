import { Suspense } from "react";
import AfterPartyForm from "./AfterPartyForm";
import { TOURNAMENT } from "@/lib/tournament";

export const metadata = {
  title: "After Party",
  description: "Join us for the Caz Masters After Party - buffet, awards, and a great time.",
};

export default function AfterPartyPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy-950 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl font-black uppercase tracking-tight">The After Party</h1>
          <p className="mt-3 text-navy-300 max-w-2xl mx-auto">
            The best part of tournament day. Join us for the buffet, awards ceremony, and a great time.
          </p>
        </div>
      </section>

      {/* Event Details */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-navy-900 mb-6">Event Details</h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-navy-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-navy-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-navy-900">Venue</p>
                    <p className="text-navy-600">{TOURNAMENT.afterPartyVenue}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-navy-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-navy-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-navy-900">Date</p>
                    <p className="text-navy-600">{TOURNAMENT.afterPartyDate}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-navy-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-navy-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-navy-900">Time</p>
                    <p className="text-navy-600">{TOURNAMENT.afterPartyTime}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-navy-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-navy-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-navy-900">Price</p>
                    <p className="text-navy-600">${TOURNAMENT.afterPartyPrice} per person</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-navy-900 mb-6">What&apos;s Included</h2>
              <ul className="space-y-4">
                {TOURNAMENT.afterPartyIncludes.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="w-2 h-2 rounded-full bg-gold-400 mt-2 shrink-0" />
                    <p className="text-navy-700 font-medium">{item}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-8 bg-navy-50 rounded-xl p-5">
                <p className="text-sm text-navy-600">
                  The after party is open to everyone &mdash; players, family, and friends.
                  It&apos;s the perfect way to cap off an incredible day of golf and camaraderie.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Registration */}
      <section className="py-16 bg-navy-50">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-navy-900 text-center mb-2">Register for the After Party</h2>
          <p className="text-center text-navy-500 mb-8">
            Secure your spot. Pay online or at the door.
          </p>
          <Suspense fallback={<div className="text-center text-navy-500 py-8">Loading...</div>}>
            <AfterPartyForm />
          </Suspense>
        </div>
      </section>
    </>
  );
}
