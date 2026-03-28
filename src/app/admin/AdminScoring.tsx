"use client";

import { useState, useEffect, useCallback } from "react";

interface ScoreEntry {
  id: string;
  playerId: string;
  holeNumber: number;
  strokes: number;
  shotgunBeer: boolean;
  rehit: boolean;
  player: { id: string; fullName: string; genderFlight: string; team: { name: string } | null };
}

interface BeerTabEntry {
  playerId: string;
  name: string;
  email: string;
  team: string;
  count: number;
  totalOwed: number;
  status: string;
  beerTabId: string | null;
}

export default function AdminScoring({ password }: { password: string }) {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [beerTab, setBeerTab] = useState<BeerTabEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<"scores" | "beers">("scores");
  const [filterPlayer, setFilterPlayer] = useState("");
  const [sendingAll, setSendingAll] = useState(false);
  const [sendingPlayer, setSendingPlayer] = useState<string | null>(null);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${password}`,
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [scoresRes, beerRes] = await Promise.all([
        fetch("/api/admin/scoring", { headers: { Authorization: `Bearer ${password}` } }),
        fetch("/api/admin/beer-tab", { headers: { Authorization: `Bearer ${password}` } }),
      ]);
      if (scoresRes.ok) {
        const data = await scoresRes.json();
        setScores(data.scores);
      }
      if (beerRes.ok) {
        const data = await beerRes.json();
        setBeerTab(data.beerTab);
      }
    } catch {
      setError("Failed to load scores");
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function updateScore(id: string, updates: Record<string, unknown>) {
    try {
      await fetch(`/api/admin/scoring/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(updates),
      });
      await fetchData();
    } catch {
      setError("Failed to update score");
    }
  }

  async function deleteScore(id: string) {
    if (!confirm("Delete this score?")) return;
    try {
      await fetch(`/api/admin/scoring/${id}`, { method: "DELETE", headers });
      await fetchData();
    } catch {
      setError("Failed to delete score");
    }
  }

  async function sendAllInvoices() {
    setSendingAll(true);
    setError("");
    try {
      const res = await fetch("/api/admin/beer-tab", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "send-all" }),
      });
      const data = await res.json();
      if (res.ok) {
        setError("");
        alert(`Sent ${data.sent} invoice${data.sent !== 1 ? "s" : ""}.`);
        await fetchData();
      } else {
        setError(data.error || "Failed to send invoices");
      }
    } catch {
      setError("Failed to send invoices");
    } finally {
      setSendingAll(false);
    }
  }

  async function sendReminder(playerId: string) {
    setSendingPlayer(playerId);
    try {
      await fetch("/api/admin/beer-tab", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "send-reminder", playerId }),
      });
      await fetchData();
    } catch {
      setError("Failed to send reminder");
    } finally {
      setSendingPlayer(null);
    }
  }

  async function toggleBeerTabPaid(playerId: string, currentStatus: string) {
    const isPaid = currentStatus === "paid_online" || currentStatus === "paid_manual";
    try {
      await fetch("/api/admin/beer-tab", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: isPaid ? "mark-unpaid" : "mark-paid", playerId }),
      });
      await fetchData();
    } catch {
      setError("Failed to update payment");
    }
  }

  if (loading) return <p className="text-navy-500 py-8 text-center">Loading scores...</p>;

  const players = [...new Set(scores.map((s) => s.player.fullName))].sort();
  const filtered = filterPlayer
    ? scores.filter((s) => s.player.fullName === filterPlayer)
    : scores;

  const totalBeers = beerTab.reduce((sum, b) => sum + b.count, 0);
  const totalOwed = beerTab.reduce((sum, b) => sum + b.totalOwed, 0);
  const totalPaid = beerTab.filter((b) => b.status === "paid_online" || b.status === "paid_manual").reduce((sum, b) => sum + b.totalOwed, 0);
  const totalUnpaid = totalOwed - totalPaid;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setView("scores")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              view === "scores" ? "bg-navy-800 text-white" : "bg-white border border-navy-200 text-navy-600"
            }`}
          >
            All Scores ({scores.length})
          </button>
          <button
            onClick={() => setView("beers")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              view === "beers" ? "bg-gold-400 text-navy-950" : "bg-white border border-navy-200 text-navy-600"
            }`}
          >
            Beer Tab ({totalBeers})
          </button>
        </div>
        <button onClick={fetchData} className="bg-white border border-navy-200 text-navy-600 px-4 py-2 rounded-lg text-sm hover:bg-navy-50">
          Refresh
        </button>
      </div>

      {view === "scores" && (
        <>
          <select
            value={filterPlayer}
            onChange={(e) => setFilterPlayer(e.target.value)}
            className="border border-navy-200 rounded-lg px-3 py-2 text-sm w-full sm:w-auto"
          >
            <option value="">All players</option>
            {players.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <div className="bg-white rounded-xl border border-navy-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-navy-50 border-b border-navy-100">
                    <th className="text-left px-4 py-2 font-semibold text-navy-700">Player</th>
                    <th className="text-center px-4 py-2 font-semibold text-navy-700">Hole</th>
                    <th className="text-center px-4 py-2 font-semibold text-navy-700">Strokes</th>
                    <th className="text-center px-4 py-2 font-semibold text-navy-700">Mulligan</th>
                    <th className="text-right px-4 py-2 font-semibold text-navy-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-navy-400">No scores recorded.</td></tr>
                  ) : (
                    filtered.map((s) => (
                      <tr key={s.id} className="border-b border-navy-50 hover:bg-navy-50/50">
                        <td className="px-4 py-2">
                          <p className="font-medium text-navy-900">{s.player.fullName}</p>
                          <p className="text-xs text-navy-400">{s.player.team?.name || "No team"}</p>
                        </td>
                        <td className="px-4 py-2 text-center text-navy-700">{s.holeNumber}</td>
                        <td className="px-4 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => updateScore(s.id, { strokes: Math.max(1, s.strokes - 1) })}
                              className="w-6 h-6 bg-navy-100 rounded text-navy-600 text-xs hover:bg-navy-200"
                            >
                              -
                            </button>
                            <span className="font-bold text-navy-900 w-6 text-center">{s.strokes}</span>
                            <button
                              onClick={() => updateScore(s.id, { strokes: s.strokes + 1 })}
                              className="w-6 h-6 bg-navy-100 rounded text-navy-600 text-xs hover:bg-navy-200"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => updateScore(s.id, { shotgunBeer: !s.shotgunBeer, rehit: !s.shotgunBeer })}
                            className={`text-xs px-2 py-0.5 rounded ${s.shotgunBeer ? "bg-gold-100 text-gold-600 font-semibold" : "bg-navy-50 text-navy-400"}`}
                          >
                            {s.shotgunBeer ? "Yes" : "No"}
                          </button>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button
                            onClick={() => deleteScore(s.id)}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {view === "beers" && (
        <div>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-navy-100">
              <p className="text-sm text-navy-500">Total Beers</p>
              <p className="text-3xl font-bold text-navy-900">{totalBeers}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-navy-100">
              <p className="text-sm text-navy-500">Total Tab</p>
              <p className="text-3xl font-bold text-gold-500">${totalOwed}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-navy-100">
              <p className="text-sm text-navy-500">Collected</p>
              <p className="text-3xl font-bold text-green-600">${totalPaid}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-navy-100">
              <p className="text-sm text-navy-500">Outstanding</p>
              <p className="text-3xl font-bold text-red-600">${totalUnpaid}</p>
            </div>
          </div>

          {/* Send all button */}
          {beerTab.some((b) => b.status === "unpaid") && (
            <div className="mb-4">
              <button
                onClick={sendAllInvoices}
                disabled={sendingAll}
                className="bg-gold-400 hover:bg-gold-300 text-navy-950 font-bold px-6 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {sendingAll ? "Sending..." : "Send All Invoices"}
              </button>
              <span className="text-xs text-navy-400 ml-3">
                Emails a Stripe payment link to every unpaid player
              </span>
            </div>
          )}

          {/* Beer tab table */}
          <div className="bg-white rounded-xl border border-navy-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy-50 border-b border-navy-100">
                  <th className="text-left px-4 py-2 font-semibold text-navy-700">Player</th>
                  <th className="text-left px-4 py-2 font-semibold text-navy-700">Team</th>
                  <th className="text-center px-4 py-2 font-semibold text-navy-700">Beers</th>
                  <th className="text-right px-4 py-2 font-semibold text-navy-700">Owes</th>
                  <th className="text-center px-4 py-2 font-semibold text-navy-700">Status</th>
                  <th className="text-right px-4 py-2 font-semibold text-navy-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {beerTab.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-navy-400">No shotgun mulligans recorded.</td></tr>
                ) : (
                  beerTab.map((b) => {
                    const isPaid = b.status === "paid_online" || b.status === "paid_manual";
                    return (
                      <tr key={b.playerId} className="border-b border-navy-50">
                        <td className="px-4 py-2">
                          <p className="font-medium text-navy-900">{b.name}</p>
                          <p className="text-xs text-navy-400">{b.email}</p>
                        </td>
                        <td className="px-4 py-2 text-navy-600">{b.team || "-"}</td>
                        <td className="px-4 py-2 text-center font-bold text-navy-900">{b.count}</td>
                        <td className="px-4 py-2 text-right font-bold text-gold-500">${b.totalOwed}</td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => toggleBeerTabPaid(b.playerId, b.status)}
                            className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                              b.status === "paid_online"
                                ? "bg-green-100 text-green-700"
                                : b.status === "paid_manual"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {b.status === "paid_online" ? "Paid Online" : b.status === "paid_manual" ? "Paid Manual" : "Unpaid"}
                          </button>
                        </td>
                        <td className="px-4 py-2 text-right">
                          {!isPaid && (
                            <button
                              onClick={() => sendReminder(b.playerId)}
                              disabled={sendingPlayer === b.playerId}
                              className="text-xs bg-navy-100 text-navy-700 hover:bg-navy-200 px-3 py-1.5 rounded-lg transition-colors font-medium disabled:opacity-50"
                            >
                              {sendingPlayer === b.playerId ? "Sending..." : "Send Reminder"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
