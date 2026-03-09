"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { TOURNAMENT } from "@/lib/tournament";

export default function AfterPartyForm() {
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [numGuests, setNumGuests] = useState(1);
  const [isPlayer, setIsPlayer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (searchParams.get("cancelled") === "true") {
      setError("Payment was cancelled. You can try again or choose to pay at the door.");
    }
  }, [searchParams]);

  async function checkPlayer() {
    if (!email) return;
    try {
      const res = await fetch("/api/afterparty/check-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.found) {
        setIsPlayer(true);
        if (data.name && !name) setName(data.name);
      } else {
        setIsPlayer(false);
      }
    } catch {
      // silently fail
    }
  }

  const total = numGuests * TOURNAMENT.afterPartyPrice;

  async function handleSubmit(paymentMethod: "stripe" | "at_door") {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/afterparty/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, numGuests, paymentMethod }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        setSubmitting(false);
        return;
      }

      if (paymentMethod === "stripe" && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="bg-white rounded-xl p-8 border border-navy-100 text-center">
        <div className="w-14 h-14 bg-gold-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-navy-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-navy-900 mb-2">You&apos;re Registered!</h3>
        <p className="text-navy-600">
          See you at {TOURNAMENT.afterPartyVenue} on {TOURNAMENT.afterPartyDate} at {TOURNAMENT.afterPartyTime}.
          Payment of ${total} will be collected at the door.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 sm:p-8 border border-navy-100">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-navy-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={checkPlayer}
            placeholder="your@email.com"
            className="w-full rounded-lg border border-navy-200 px-4 py-3 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 focus:outline-none"
          />
          {isPlayer && (
            <p className="mt-1 text-sm text-gold-600 font-semibold flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-gold-400" />
              Tournament Player &mdash; welcome back!
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-navy-700 mb-1">Full Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="w-full rounded-lg border border-navy-200 px-4 py-3 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-navy-700 mb-1">Number of Guests</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setNumGuests(Math.max(1, numGuests - 1))}
              className="w-10 h-10 rounded-lg border border-navy-200 text-navy-600 hover:bg-navy-50 flex items-center justify-center text-xl font-bold"
            >
              -
            </button>
            <span className="text-2xl font-bold text-navy-900 w-12 text-center">{numGuests}</span>
            <button
              type="button"
              onClick={() => setNumGuests(Math.min(20, numGuests + 1))}
              className="w-10 h-10 rounded-lg border border-navy-200 text-navy-600 hover:bg-navy-50 flex items-center justify-center text-xl font-bold"
            >
              +
            </button>
            <span className="text-sm text-navy-500 ml-2">
              {numGuests === 1 ? "person" : "people"}
            </span>
          </div>
        </div>

        <div className="bg-navy-50 rounded-lg p-4 text-center">
          <p className="text-sm text-navy-500">Total</p>
          <p className="text-3xl font-bold text-navy-900">${total}</p>
          <p className="text-xs text-navy-400 mt-1">
            ${TOURNAMENT.afterPartyPrice} &times; {numGuests} guest{numGuests > 1 ? "s" : ""}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3 pt-2">
          <button
            onClick={() => handleSubmit("stripe")}
            disabled={submitting || !name || !email}
            className="w-full bg-gold-400 hover:bg-gold-300 text-navy-950 font-black py-3 rounded-lg transition-colors uppercase tracking-wider disabled:opacity-50"
          >
            {submitting ? "Processing..." : `Pay $${total} Now`}
          </button>
          <button
            onClick={() => handleSubmit("at_door")}
            disabled={submitting || !name || !email}
            className="w-full bg-navy-800 hover:bg-navy-900 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {submitting ? "Processing..." : "Pay at the Door"}
          </button>
        </div>
      </div>
    </div>
  );
}
