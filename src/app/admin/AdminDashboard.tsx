"use client";

import { useState, useEffect, useCallback } from "react";
import AdminTeams from "./AdminTeams";
import AdminHallOfFame from "./AdminHallOfFame";
import AdminGallery from "./AdminGallery";
import AdminDonations from "./AdminDonations";
import AdminCourse from "./AdminCourse";
import AdminScoring from "./AdminScoring";
import AdminStore from "./AdminStore";
import AdminAfterParty from "./AdminAfterParty";
import AdminPolls from "./AdminPolls";

interface Payment {
  id: string;
  amount: number;
  status: string;
  method: string | null;
}

interface Player {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  shirtSize: string;
  genderFlight: string;
  teamPreference: string | null;
  returningPlayer: boolean;
  dietaryNeeds: string | null;
  payment: Payment | null;
  createdAt: string;
}

interface Tournament {
  id: string;
  registrationOpen: boolean;
  freeRegistration: boolean;
  entryFee: number;
  maxPlayers: number;
  finalized: boolean;
}

const TABS = [
  { id: "players", label: "Players" },
  { id: "teams", label: "Teams" },
  { id: "course", label: "Course & PINs" },
  { id: "scoring", label: "Live Scores" },
  { id: "hall-of-fame", label: "Hall of Fame" },
  { id: "gallery", label: "Gallery" },
  { id: "donations", label: "Donations" },
  { id: "store", label: "Store" },
  { id: "after-party", label: "After Party" },
  { id: "polls", label: "Polls" },
  { id: "tournament-mgmt", label: "Tournament" },
];

export default function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("players");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/players", {
        headers: { Authorization: `Bearer ${password}` },
      });
      if (!res.ok) {
        setAuthed(false);
        setError("Invalid password");
        return;
      }
      const data = await res.json();
      setPlayers(data.players);
      setTournament(data.tournament);
      setError("");
    } catch {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => {
    if (authed) fetchData();
  }, [authed, fetchData]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthed(true);
  }

  async function toggleRegistration() {
    if (!tournament) return;
    try {
      await fetch("/api/admin/tournament", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify({ registrationOpen: !tournament.registrationOpen }),
      });
      setTournament({ ...tournament, registrationOpen: !tournament.registrationOpen });
    } catch {
      setError("Failed to update tournament");
    }
  }

  async function toggleFreeRegistration() {
    if (!tournament) return;
    try {
      await fetch("/api/admin/tournament", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify({ freeRegistration: !tournament.freeRegistration }),
      });
      setTournament({ ...tournament, freeRegistration: !tournament.freeRegistration });
    } catch {
      setError("Failed to update tournament");
    }
  }

  async function updateEntryFee(feeDollars: number) {
    if (!tournament) return;
    const feeCents = Math.round(feeDollars * 100);
    try {
      await fetch("/api/admin/tournament", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify({ entryFee: feeCents }),
      });
      setTournament({ ...tournament, entryFee: feeCents });
    } catch {
      setError("Failed to update entry fee");
    }
  }

  async function updatePaymentStatus(playerId: string, paymentStatus: string) {
    try {
      await fetch(`/api/admin/players/${playerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify({ paymentStatus }),
      });
      await fetchData();
    } catch {
      setError("Failed to update payment");
    }
  }

  function exportCSV() {
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Shirt Size",
      "Flight",
      "Team Preference",
      "Returning",
      "Dietary Needs",
      "Payment Status",
      "Payment Method",
      "Registered",
    ];
    const rows = players.map((p) => [
      p.fullName,
      p.email,
      p.phone,
      p.shirtSize,
      p.genderFlight,
      p.teamPreference || "",
      p.returningPlayer ? "Yes" : "No",
      p.dietaryNeeds || "",
      p.payment?.status || "unknown",
      p.payment?.method || "",
      new Date(p.createdAt).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `caz-masters-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function statusBadge(status: string) {
    const colors: Record<string, string> = {
      paid_online: "bg-navy-100 text-navy-700",
      paid_manual: "bg-blue-100 text-blue-800",
      unpaid: "bg-red-100 text-red-800",
    };
    const labels: Record<string, string> = {
      paid_online: "Paid Online",
      paid_manual: "Paid Manual",
      unpaid: "Unpaid",
    };
    return (
      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${colors[status] || "bg-gray-100 text-gray-800"}`}>
        {labels[status] || status}
      </span>
    );
  }

  if (!authed) {
    return (
      <section className="py-20 bg-white min-h-screen">
        <div className="max-w-sm mx-auto px-4">
          <h1 className="text-2xl font-bold text-navy-900 mb-6 text-center">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-navy-200 px-4 py-3 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 focus:outline-none"
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-navy-800 hover:bg-navy-900 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </section>
    );
  }

  const paidCount = players.filter((p) => p.payment?.status === "paid_online" || p.payment?.status === "paid_manual").length;
  const unpaidCount = players.filter((p) => p.payment?.status === "unpaid").length;

  return (
    <section className="py-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">Admin Dashboard</h1>
            <p className="text-navy-500 text-sm">The Caz Masters 2026</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto border-b border-navy-200 pb-px">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? "bg-white text-navy-900 border border-navy-200 border-b-white -mb-px"
                  : "text-navy-500 hover:text-navy-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Players Tab */}
        {activeTab === "players" && (
          <>
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={fetchData}
                disabled={loading}
                className="bg-white border border-navy-200 text-navy-600 px-4 py-2 rounded-lg text-sm hover:bg-navy-50 transition-colors"
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
              <button
                onClick={exportCSV}
                className="bg-white border border-navy-200 text-navy-600 px-4 py-2 rounded-lg text-sm hover:bg-navy-50 transition-colors"
              >
                Export CSV
              </button>
              <button
                onClick={toggleRegistration}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  tournament?.registrationOpen
                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                    : "bg-navy-100 text-navy-600 hover:bg-navy-200"
                }`}
              >
                {tournament?.registrationOpen ? "Close Registration" : "Open Registration"}
              </button>
              <button
                onClick={toggleFreeRegistration}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  tournament?.freeRegistration
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-navy-100 text-navy-600 hover:bg-navy-200"
                }`}
              >
                {tournament?.freeRegistration ? "Free Reg: ON" : "Free Reg: OFF"}
              </button>
              {!tournament?.freeRegistration && (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-navy-500">Fee: $</span>
                  <input
                    type="number"
                    defaultValue={tournament ? tournament.entryFee / 100 : 150}
                    min={0}
                    className="w-20 border border-navy-200 rounded-lg px-2 py-1.5 text-sm"
                    onBlur={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val > 0) updateEntryFee(val);
                    }}
                  />
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl p-4 border border-navy-100">
                <p className="text-sm text-navy-500">Total Registered</p>
                <p className="text-3xl font-bold text-navy-900">{players.length}</p>
                <p className="text-xs text-navy-400">of {tournament?.maxPlayers || 72}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-navy-100">
                <p className="text-sm text-navy-500">Paid</p>
                <p className="text-3xl font-bold text-navy-900">{paidCount}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-navy-100">
                <p className="text-sm text-red-600">Unpaid</p>
                <p className="text-3xl font-bold text-red-700">{unpaidCount}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-navy-100">
                <p className="text-sm text-navy-500">Registration</p>
                <p className="text-xl font-bold mt-1">
                  {tournament?.registrationOpen ? (
                    <span className="text-navy-600">Open</span>
                  ) : (
                    <span className="text-red-700">Closed</span>
                  )}
                </p>
              </div>
            </div>

            {/* Player table */}
            <div className="bg-white rounded-xl border border-navy-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-navy-50 border-b border-navy-100">
                      <th className="text-left px-4 py-3 font-semibold text-navy-700">Name</th>
                      <th className="text-left px-4 py-3 font-semibold text-navy-700 hidden sm:table-cell">Email</th>
                      <th className="text-left px-4 py-3 font-semibold text-navy-700 hidden md:table-cell">Phone</th>
                      <th className="text-left px-4 py-3 font-semibold text-navy-700 hidden lg:table-cell">Shirt</th>
                      <th className="text-left px-4 py-3 font-semibold text-navy-700">Flight</th>
                      <th className="text-left px-4 py-3 font-semibold text-navy-700 hidden lg:table-cell">Team Pref</th>
                      <th className="text-left px-4 py-3 font-semibold text-navy-700">Payment</th>
                      <th className="text-left px-4 py-3 font-semibold text-navy-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-navy-400">
                          No registrations yet.
                        </td>
                      </tr>
                    ) : (
                      players.map((player) => (
                        <tr key={player.id} className="border-b border-navy-50 hover:bg-navy-50/50">
                          <td className="px-4 py-3 font-medium text-navy-900">
                            {player.fullName}
                            {player.returningPlayer && (
                              <span className="ml-1 text-xs text-gold-500" title="Returning player">*</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-navy-600 hidden sm:table-cell">{player.email}</td>
                          <td className="px-4 py-3 text-navy-600 hidden md:table-cell">{player.phone}</td>
                          <td className="px-4 py-3 text-navy-600 hidden lg:table-cell">{player.shirtSize}</td>
                          <td className="px-4 py-3 text-navy-600">{player.genderFlight}</td>
                          <td className="px-4 py-3 text-navy-600 hidden lg:table-cell">
                            {player.teamPreference || "-"}
                          </td>
                          <td className="px-4 py-3">
                            {statusBadge(player.payment?.status || "unpaid")}
                          </td>
                          <td className="px-4 py-3">
                            {player.payment?.status !== "paid_online" && player.payment?.status !== "paid_manual" && (
                              <button
                                onClick={() => updatePaymentStatus(player.id, "paid_manual")}
                                className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors font-medium"
                              >
                                Mark Paid
                              </button>
                            )}
                            {(player.payment?.status === "paid_online" || player.payment?.status === "paid_manual") && (
                              <button
                                onClick={() => updatePaymentStatus(player.id, "unpaid")}
                                className="text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
                              >
                                Mark Unpaid
                              </button>
                            )}
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

        {/* Other tabs */}
        {activeTab === "teams" && <AdminTeams password={password} />}
        {activeTab === "course" && <AdminCourse password={password} />}
        {activeTab === "scoring" && <AdminScoring password={password} />}
        {activeTab === "hall-of-fame" && <AdminHallOfFame password={password} />}
        {activeTab === "gallery" && <AdminGallery password={password} />}
        {activeTab === "donations" && <AdminDonations password={password} />}
        {activeTab === "store" && <AdminStore password={password} />}
        {activeTab === "after-party" && <AdminAfterParty password={password} />}
        {activeTab === "polls" && <AdminPolls password={password} />}
        {activeTab === "tournament-mgmt" && (
          <TournamentManagement
            password={password}
            finalized={tournament?.finalized ?? false}
            onComplete={fetchData}
          />
        )}
      </div>
    </section>
  );
}

function TournamentManagement({ password, finalized, onComplete }: { password: string; finalized: boolean; onComplete: () => void }) {
  const [resetStep, setResetStep] = useState(0);
  const [finalizeStep, setFinalizeStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${password}`,
  };

  async function handleReset() {
    if (resetStep < 2) {
      setResetStep(resetStep + 1);
      return;
    }
    setProcessing(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/admin/tournament/reset", {
        method: "POST",
        headers,
        body: JSON.stringify({ confirm: "RESET" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Reset failed");
      } else {
        setResult(data.message);
        onComplete();
      }
    } catch {
      setError("Reset failed");
    } finally {
      setProcessing(false);
      setResetStep(0);
    }
  }

  async function handleFinalize() {
    if (finalizeStep < 2) {
      setFinalizeStep(finalizeStep + 1);
      return;
    }
    setProcessing(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/admin/tournament/finalize", {
        method: "POST",
        headers,
        body: JSON.stringify({ confirm: "FINALIZE" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Finalization failed");
      } else {
        setResult(data.message);
        onComplete();
      }
    } catch {
      setError("Finalization failed");
    } finally {
      setProcessing(false);
      setFinalizeStep(0);
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}
      {result && (
        <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg px-4 py-3 text-sm">{result}</div>
      )}

      {/* Finalize Tournament */}
      <div className={`rounded-xl border-2 p-6 ${finalized ? "border-gold-400 bg-gold-50" : "border-navy-200 bg-white"}`}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gold-400 flex items-center justify-center shrink-0">
            <span className="text-2xl">&#127942;</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-navy-900">Finalize Tournament</h3>
            {finalized ? (
              <p className="text-gold-700 font-semibold mt-1">This tournament has been finalized.</p>
            ) : (
              <>
                <p className="text-navy-600 text-sm mt-1">
                  Lock all scores, auto-populate the Hall of Fame with winners, close registration,
                  and create next year&apos;s tournament. All data is preserved permanently.
                </p>
                <ul className="text-navy-500 text-xs mt-3 space-y-1">
                  <li>&#x2022; Locks scores &mdash; no more editing</li>
                  <li>&#x2022; Writes champions to Hall of Fame (men&apos;s, women&apos;s, team, shotgun, fan votes)</li>
                  <li>&#x2022; Closes registration and locks teams</li>
                  <li>&#x2022; Freezes leaderboard as official final results</li>
                  <li>&#x2022; Creates next year&apos;s tournament record</li>
                </ul>
                <div className="mt-4">
                  {finalizeStep === 0 && (
                    <button
                      onClick={handleFinalize}
                      disabled={processing}
                      className="bg-gold-400 hover:bg-gold-300 text-navy-950 font-bold px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Finalize Tournament
                    </button>
                  )}
                  {finalizeStep === 1 && (
                    <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
                      <p className="text-amber-800 font-bold text-sm">Are you sure?</p>
                      <p className="text-amber-700 text-xs mt-1">This will lock all scores and write final results. This cannot be undone.</p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={handleFinalize}
                          disabled={processing}
                          className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                        >
                          Yes, Finalize
                        </button>
                        <button
                          onClick={() => setFinalizeStep(0)}
                          className="bg-white border border-navy-200 text-navy-600 px-4 py-2 rounded-lg text-sm hover:bg-navy-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  {finalizeStep === 2 && (
                    <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                      <p className="text-red-800 font-bold text-sm">Final confirmation</p>
                      <p className="text-red-700 text-xs mt-1">Scores will be permanently locked. Hall of Fame entries will be created. This is irreversible.</p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={handleFinalize}
                          disabled={processing}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                        >
                          {processing ? "Finalizing..." : "FINALIZE NOW"}
                        </button>
                        <button
                          onClick={() => setFinalizeStep(0)}
                          className="bg-white border border-navy-200 text-navy-600 px-4 py-2 rounded-lg text-sm hover:bg-navy-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Reset Tournament */}
      <div className="rounded-xl border-2 border-red-200 bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <span className="text-2xl">&#9888;&#65039;</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-900">Reset Tournament Data</h3>
            <p className="text-navy-600 text-sm mt-1">
              Delete all player registrations, teams, scores, payments, after party registrations, and votes.
              Use this to clear test data before launch.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
              <p className="text-red-800 text-xs font-semibold">What gets DELETED:</p>
              <p className="text-red-700 text-xs mt-1">
                Players, teams, scores, payments, beer tabs, after party registrations, poll votes
              </p>
              <p className="text-green-800 text-xs font-semibold mt-2">What is PRESERVED:</p>
              <p className="text-green-700 text-xs mt-1">
                Tournament config, course data, Hall of Fame, gallery, store products, poll configs, accounts
              </p>
            </div>
            <div className="mt-4">
              {resetStep === 0 && (
                <button
                  onClick={handleReset}
                  disabled={processing}
                  className="bg-red-100 hover:bg-red-200 text-red-800 font-bold px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  Reset Tournament Data
                </button>
              )}
              {resetStep === 1 && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
                  <p className="text-amber-800 font-bold text-sm">Are you sure?</p>
                  <p className="text-amber-700 text-xs mt-1">This will delete ALL registrations, scores, teams, and payments. This cannot be undone.</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleReset}
                      disabled={processing}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                      Yes, I&apos;m Sure
                    </button>
                    <button
                      onClick={() => setResetStep(0)}
                      className="bg-white border border-navy-200 text-navy-600 px-4 py-2 rounded-lg text-sm hover:bg-navy-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {resetStep === 2 && (
                <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                  <p className="text-red-800 font-bold text-sm">LAST CHANCE</p>
                  <p className="text-red-700 text-xs mt-1">All player data will be permanently deleted. There is no undo. Are you absolutely sure?</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleReset}
                      disabled={processing}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                      {processing ? "Resetting..." : "DELETE EVERYTHING"}
                    </button>
                    <button
                      onClick={() => setResetStep(0)}
                      className="bg-white border border-navy-200 text-navy-600 px-4 py-2 rounded-lg text-sm hover:bg-navy-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
