"use client";

import { useState, useEffect } from "react";
import { TOURNAMENT } from "@/lib/tournament";

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  shirtSize: string;
  genderFlight: string;
}

interface Props {
  prefill?: FormData | null;
}

export default function RegistrationForm({ prefill }: Props) {
  const [form, setForm] = useState<FormData>(
    prefill ?? { fullName: "", email: "", phone: "", shirtSize: "", genderFlight: "" }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Tournament settings from DB
  const [freeRegistration, setFreeRegistration] = useState(false);
  const [entryFee, setEntryFee] = useState(TOURNAMENT.entryFee);

  // After party state
  const [addAfterParty, setAddAfterParty] = useState(false);
  const [afterPartyGuests, setAfterPartyGuests] = useState(1);
  const [afterPartyKids, setAfterPartyKids] = useState(0);

  // Honeypot — bots auto-fill fields named like "website"; real users never see it.
  const [website, setWebsite] = useState("");

  useEffect(() => {
    fetch("/api/tournament-info")
      .then((r) => r.json())
      .then((data) => {
        setFreeRegistration(data.freeRegistration ?? false);
        setEntryFee(data.entryFee ?? TOURNAMENT.entryFee);
      })
      .catch(() => {});
  }, []);

  function update(field: keyof FormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const tournamentTotal = entryFee;

  async function handleSubmit(paymentMethod: "stripe" | "day_of" | "free") {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          paymentMethod,
          afterParty: addAfterParty ? { numGuests: afterPartyGuests, numKids: afterPartyKids } : null,
          website,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
        return;
      }

      if (data.redirect) {
        window.location.href = data.redirect;
      } else if (paymentMethod === "stripe" && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        const waitlistParam = data.waitlisted ? "&waitlisted=true" : "";
        window.location.href = `/register/confirmation?status=day_of${waitlistParam}`;
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border-2 border-navy-200 bg-white px-4 py-3.5 text-navy-900 placeholder:text-navy-300 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-none transition-colors text-base";
  const labelClass = "block text-sm font-bold text-navy-700 mb-1.5 uppercase tracking-wider";

  const isValid = form.fullName && form.email && form.phone && form.shirtSize && form.genderFlight;

  return (
    <div className="space-y-5">
      {/* Honeypot: hidden from real users via CSS + aria-hidden + tabIndex. Bots fill it; we drop the submission. */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", left: "-10000px", top: "auto", width: "1px", height: "1px", overflow: "hidden" }}
      >
        <label htmlFor="website">Website</label>
        <input
          type="text"
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm font-medium">
          {error}
        </div>
      )}

      <div>
        <label className={labelClass}>Name</label>
        <input
          type="text"
          required
          className={inputClass}
          placeholder="Your full name"
          value={form.fullName}
          onChange={(e) => update("fullName", e.target.value)}
        />
      </div>

      <div>
        <label className={labelClass}>Email</label>
        <input
          type="email"
          required
          className={inputClass}
          placeholder="you@email.com"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />
      </div>

      <div>
        <label className={labelClass}>Phone</label>
        <input
          type="tel"
          required
          className={inputClass}
          placeholder="(555) 123-4567"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Shirt Size</label>
          <select
            required
            className={inputClass}
            value={form.shirtSize}
            onChange={(e) => update("shirtSize", e.target.value)}
          >
            <option value="">Pick one</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
            <option value="XXL">XXL</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Flight</label>
          <select
            required
            className={inputClass}
            value={form.genderFlight}
            onChange={(e) => update("genderFlight", e.target.value)}
          >
            <option value="">Pick one</option>
            <option value="Men">Men</option>
            <option value="Women">Women</option>
          </select>
        </div>
      </div>

      {/* After Party Upsell */}
      <div className="border-2 border-navy-100 rounded-xl p-5 bg-navy-50/50">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="afterParty"
            className="h-5 w-5 rounded border-navy-300 text-gold-500 focus:ring-gold-400 mt-0.5"
            checked={addAfterParty}
            onChange={(e) => setAddAfterParty(e.target.checked)}
          />
          <div className="flex-1">
            <label htmlFor="afterParty" className="text-navy-900 font-bold text-base cursor-pointer">
              Add the After Party
            </label>
            <p className="text-navy-500 text-sm mt-1">
              {TOURNAMENT.afterPartyVenue} &middot; {TOURNAMENT.afterPartyDate} at {TOURNAMENT.afterPartyTime}
            </p>
            <p className="text-navy-500 text-sm">
              {TOURNAMENT.afterPartyIncludes.join(", ")}
            </p>
            <p className="text-gold-600 font-bold text-sm mt-1">
              Kids are free
            </p>
          </div>
        </div>

        {addAfterParty && (
          <div className="mt-4 pl-8 space-y-3">
            <div>
              <label className="block text-sm font-semibold text-navy-700 mb-2">
                Paying adults <span className="font-normal text-navy-400">(including yourself)</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAfterPartyGuests(Math.max(1, afterPartyGuests - 1))}
                  className="w-9 h-9 rounded-lg border-2 border-navy-200 text-navy-600 hover:bg-navy-100 flex items-center justify-center text-lg font-bold"
                >
                  -
                </button>
                <span className="text-xl font-bold text-navy-900 w-8 text-center">{afterPartyGuests}</span>
                <button
                  type="button"
                  onClick={() => setAfterPartyGuests(Math.min(20, afterPartyGuests + 1))}
                  className="w-9 h-9 rounded-lg border-2 border-navy-200 text-navy-600 hover:bg-navy-100 flex items-center justify-center text-lg font-bold"
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy-700 mb-2">
                Kids <span className="font-normal text-navy-400">(free — just need a headcount)</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAfterPartyKids(Math.max(0, afterPartyKids - 1))}
                  className="w-9 h-9 rounded-lg border-2 border-navy-200 text-navy-600 hover:bg-navy-100 flex items-center justify-center text-lg font-bold"
                >
                  -
                </button>
                <span className="text-xl font-bold text-navy-900 w-8 text-center">{afterPartyKids}</span>
                <button
                  type="button"
                  onClick={() => setAfterPartyKids(Math.min(20, afterPartyKids + 1))}
                  className="w-9 h-9 rounded-lg border-2 border-navy-200 text-navy-600 hover:bg-navy-100 flex items-center justify-center text-lg font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment / Register */}
      <div className="border-t-2 border-navy-100 pt-6 space-y-3">
        {freeRegistration ? (
          <>
            <button
              onClick={() => handleSubmit("free")}
              disabled={loading || !isValid}
              className="w-full bg-gold-400 hover:bg-gold-300 disabled:bg-navy-200 disabled:text-navy-400 text-navy-950 font-black py-4 rounded-xl transition-all text-lg uppercase tracking-wide hover:scale-[1.02]"
            >
              {loading ? "Hold tight..." : "Register"}
            </button>
            <p className="text-center text-xs text-navy-400 mt-2">
              Payment will be collected later.
            </p>
          </>
        ) : (
          <>
            <button
              onClick={() => handleSubmit("stripe")}
              disabled={loading || !isValid}
              className="w-full bg-gold-400 hover:bg-gold-300 disabled:bg-navy-200 disabled:text-navy-400 text-navy-950 font-black py-4 rounded-xl transition-all text-lg uppercase tracking-wide hover:scale-[1.02]"
            >
              {loading ? "Hold tight..." : `Pay $${tournamentTotal} Now`}
            </button>

            <button
              onClick={() => handleSubmit("day_of")}
              disabled={loading || !isValid}
              className="w-full bg-navy-900 hover:bg-navy-800 disabled:bg-navy-200 disabled:text-navy-400 text-white font-bold py-4 rounded-xl transition-all text-base"
            >
              {loading ? "Hold tight..." : "I'll Pay Day-Of"}
            </button>

            <p className="text-center text-xs text-navy-400 mt-2">
              Card &amp; Venmo accepted via Stripe. Or just bring cash.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
