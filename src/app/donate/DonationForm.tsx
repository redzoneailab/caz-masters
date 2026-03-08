"use client";

import { useState } from "react";

const PRESET_AMOUNTS = [25, 50, 100];

export default function DonationForm() {
  const [amount, setAmount] = useState<number | null>(50);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [dedicate, setDedicate] = useState(false);
  const [dedicatedTo, setDedicatedTo] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function selectPreset(val: number) {
    setAmount(val);
    setIsCustom(false);
    setCustomAmount("");
  }

  function selectCustom() {
    setIsCustom(true);
    setAmount(null);
  }

  const finalAmount = isCustom ? parseInt(customAmount) || 0 : amount || 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (finalAmount < 1) {
      setError("Please enter a donation amount");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          donorName: donorName || undefined,
          donorEmail: donorEmail || undefined,
          dedicatedTo: dedicate ? dedicatedTo || undefined : undefined,
          message: message || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        return;
      }

      const { checkoutUrl } = await res.json();
      window.location.href = checkoutUrl;
    } catch {
      setError("Failed to process donation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Amount selection */}
      <div>
        <label className="block text-sm font-semibold text-navy-700 mb-3">Amount</label>
        <div className="flex gap-3">
          {PRESET_AMOUNTS.map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => selectPreset(val)}
              className={`flex-1 py-3 rounded-lg font-bold text-lg transition-colors border-2 ${
                !isCustom && amount === val
                  ? "border-gold-400 bg-gold-50 text-navy-900"
                  : "border-navy-100 bg-white text-navy-600 hover:border-navy-200"
              }`}
            >
              ${val}
            </button>
          ))}
          <button
            type="button"
            onClick={selectCustom}
            className={`flex-1 py-3 rounded-lg font-semibold transition-colors border-2 ${
              isCustom
                ? "border-gold-400 bg-gold-50 text-navy-900"
                : "border-navy-100 bg-white text-navy-600 hover:border-navy-200"
            }`}
          >
            Other
          </button>
        </div>
        {isCustom && (
          <div className="mt-3 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-400 font-semibold">$</span>
            <input
              type="number"
              min="1"
              max="10000"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full rounded-lg border border-navy-200 pl-8 pr-4 py-3 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-none"
              autoFocus
            />
          </div>
        )}
      </div>

      {/* Donor info */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1">Name (optional)</label>
          <input
            type="text"
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-lg border border-navy-200 px-4 py-2.5 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1">Email (optional)</label>
          <input
            type="email"
            value={donorEmail}
            onChange={(e) => setDonorEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full rounded-lg border border-navy-200 px-4 py-2.5 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-none"
          />
        </div>
      </div>

      {/* Dedication */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={dedicate}
            onChange={(e) => setDedicate(e.target.checked)}
            className="rounded border-navy-300 text-gold-500 focus:ring-gold-400"
          />
          <span className="text-sm text-navy-700">Dedicate this donation</span>
        </label>
        {dedicate && (
          <div className="mt-3 space-y-3">
            <input
              type="text"
              value={dedicatedTo}
              onChange={(e) => setDedicatedTo(e.target.value)}
              placeholder="In honor / memory of..."
              className="w-full rounded-lg border border-navy-200 px-4 py-2.5 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-none"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Optional message"
              rows={2}
              className="w-full rounded-lg border border-navy-200 px-4 py-2.5 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-none resize-none"
            />
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || finalAmount < 1}
        className="w-full bg-gold-400 hover:bg-gold-300 text-navy-950 font-black py-3.5 rounded-lg transition-colors uppercase tracking-wider disabled:opacity-50"
      >
        {loading ? "Processing..." : `Donate $${finalAmount}`}
      </button>

      <p className="text-xs text-navy-400 text-center">
        Secure payment processed by Stripe. You&apos;ll be redirected to complete your donation.
      </p>
    </form>
  );
}
