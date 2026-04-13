"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

interface Payment {
  id: string;
  amount: number;
  status: string;
  method: string | null;
}

interface Team {
  id: string;
  name: string;
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
  team: Team | null;
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

type PaymentFilter = "all" | "paid" | "unpaid";
type FlightFilter = "all" | "Men" | "Women";
type TeamFilter = "all" | "assigned" | "unassigned";

export default function AdminPlayers({ password }: { password: string }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [flightFilter, setFlightFilter] = useState<FlightFilter>("all");
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("all");

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Edit modal
  const [editing, setEditing] = useState<Player | null>(null);
  const [editForm, setEditForm] = useState({ fullName: "", email: "", phone: "", shirtSize: "", genderFlight: "", teamPreference: "", dietaryNeeds: "" });
  const [saving, setSaving] = useState(false);

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ fullName: "", email: "", phone: "", shirtSize: "", genderFlight: "" });

  // Bulk assign
  const [bulkTeamId, setBulkTeamId] = useState("");

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${password}` };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [playersRes, teamsRes] = await Promise.all([
        fetch("/api/admin/players", { headers: { Authorization: `Bearer ${password}` } }),
        fetch("/api/admin/teams", { headers: { Authorization: `Bearer ${password}` } }),
      ]);
      if (!playersRes.ok) throw new Error();
      const pData = await playersRes.json();
      setPlayers(pData.players);
      setTournament(pData.tournament);
      if (teamsRes.ok) {
        const tData = await teamsRes.json();
        setTeams(tData.teams || []);
      }
    } catch {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    let result = players;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.team?.name || "").toLowerCase().includes(q)
      );
    }
    if (paymentFilter === "paid") result = result.filter((p) => p.payment?.status === "paid_online" || p.payment?.status === "paid_manual");
    if (paymentFilter === "unpaid") result = result.filter((p) => p.payment?.status === "unpaid" || !p.payment);
    if (flightFilter !== "all") result = result.filter((p) => p.genderFlight === flightFilter);
    if (teamFilter === "assigned") result = result.filter((p) => p.team);
    if (teamFilter === "unassigned") result = result.filter((p) => !p.team);
    return result;
  }, [players, search, paymentFilter, flightFilter, teamFilter]);

  async function updatePaymentStatus(playerId: string, paymentStatus: string) {
    try {
      await fetch(`/api/admin/players/${playerId}`, { method: "PATCH", headers, body: JSON.stringify({ paymentStatus }) });
      await fetchData();
    } catch { setError("Failed to update"); }
  }

  async function removePlayer(id: string) {
    if (!confirm("Remove this player? This deletes their registration, payment, and scores.")) return;
    try {
      await fetch(`/api/admin/players/${id}`, { method: "DELETE", headers });
      setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
      await fetchData();
    } catch { setError("Failed to remove player"); }
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/players/${editing.id}`, { method: "PATCH", headers, body: JSON.stringify(editForm) });
      setEditing(null);
      await fetchData();
    } catch { setError("Failed to save"); }
    finally { setSaving(false); }
  }

  async function addPlayer(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/players", { method: "POST", headers, body: JSON.stringify(addForm) });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed"); setSaving(false); return; }
      setShowAdd(false);
      setAddForm({ fullName: "", email: "", phone: "", shirtSize: "", genderFlight: "" });
      await fetchData();
    } catch { setError("Failed to add"); }
    finally { setSaving(false); }
  }

  // Bulk actions
  async function bulkMarkPaid() {
    for (const id of selected) await fetch(`/api/admin/players/${id}`, { method: "PATCH", headers, body: JSON.stringify({ paymentStatus: "paid_manual" }) });
    setSelected(new Set());
    await fetchData();
  }

  async function bulkAssignTeam() {
    if (!bulkTeamId) return;
    for (const id of selected) await fetch(`/api/admin/players/${id}`, { method: "PATCH", headers, body: JSON.stringify({ teamId: bulkTeamId }) });
    setSelected(new Set());
    setBulkTeamId("");
    await fetchData();
  }

  async function bulkRemove() {
    if (!confirm(`Remove ${selected.size} player(s)? This cannot be undone.`)) return;
    for (const id of selected) await fetch(`/api/admin/players/${id}`, { method: "DELETE", headers });
    setSelected(new Set());
    await fetchData();
  }

  function toggleSelect(id: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((p) => p.id)));
  }

  function openEdit(p: Player) {
    setEditing(p);
    setEditForm({
      fullName: p.fullName, email: p.email, phone: p.phone,
      shirtSize: p.shirtSize, genderFlight: p.genderFlight,
      teamPreference: p.teamPreference || "", dietaryNeeds: p.dietaryNeeds || "",
    });
  }

  function exportCSV() {
    const hdrs = ["Name","Email","Phone","Shirt","Flight","Team","Payment","Method","Registered"];
    const rows = players.map((p) => [
      p.fullName, p.email, p.phone, p.shirtSize, p.genderFlight,
      p.team?.name || "", p.payment?.status || "unknown", p.payment?.method || "",
      new Date(p.createdAt).toLocaleDateString(),
    ]);
    const csv = [hdrs, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `caz-masters-players-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  }

  const paidCount = players.filter((p) => p.payment?.status === "paid_online" || p.payment?.status === "paid_manual").length;
  const unpaidCount = players.filter((p) => p.payment?.status === "unpaid" || !p.payment).length;
  const selectClass = "border border-navy-200 rounded-lg px-3 py-2 text-sm bg-white";
  const inputClass = "w-full border border-navy-200 rounded-lg px-3 py-2 text-sm";

  if (loading) return <p className="text-navy-500 py-8 text-center">Loading players...</p>;

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">
          {error} <button onClick={() => setError("")} className="ml-2 font-bold">&times;</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-navy-100">
          <p className="text-sm text-navy-500">Registered</p>
          <p className="text-3xl font-bold text-navy-900">{players.length}</p>
          <p className="text-xs text-navy-400">of {tournament?.maxPlayers || 60}</p>
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
          <p className="text-xl font-bold mt-1">{tournament?.registrationOpen ? <span className="text-navy-600">Open</span> : <span className="text-red-700">Closed</span>}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2">
        <button onClick={fetchData} className="bg-white border border-navy-200 text-navy-600 px-4 py-2 rounded-lg text-sm hover:bg-navy-50">Refresh</button>
        <button onClick={exportCSV} className="bg-white border border-navy-200 text-navy-600 px-4 py-2 rounded-lg text-sm hover:bg-navy-50">Export CSV</button>
        <button onClick={() => setShowAdd(true)} className="bg-gold-400 hover:bg-gold-300 text-navy-950 font-bold px-4 py-2 rounded-lg text-sm">Add Player</button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text" placeholder="Search name, email, or team..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] border border-navy-200 rounded-lg px-3 py-2 text-sm focus:border-navy-500 focus:ring-1 focus:ring-navy-500/20 focus:outline-none"
        />
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)} className={selectClass}>
          <option value="all">All Payments</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>
        <select value={flightFilter} onChange={(e) => setFlightFilter(e.target.value as FlightFilter)} className={selectClass}>
          <option value="all">All Flights</option>
          <option value="Men">Men</option>
          <option value="Women">Women</option>
        </select>
        <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value as TeamFilter)} className={selectClass}>
          <option value="all">All Teams</option>
          <option value="assigned">On a Team</option>
          <option value="unassigned">Unassigned</option>
        </select>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="bg-navy-50 border border-navy-200 rounded-lg p-3 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-navy-700">{selected.size} selected</span>
          <button onClick={bulkMarkPaid} className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium">Mark Paid</button>
          <div className="flex items-center gap-1">
            <select value={bulkTeamId} onChange={(e) => setBulkTeamId(e.target.value)} className="border border-navy-200 rounded-lg px-2 py-1.5 text-xs">
              <option value="">Assign to team...</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {bulkTeamId && <button onClick={bulkAssignTeam} className="text-xs bg-navy-100 text-navy-700 hover:bg-navy-200 px-3 py-1.5 rounded-lg font-medium">Assign</button>}
          </div>
          <button onClick={bulkRemove} className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium">Remove</button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-navy-400 hover:text-navy-600 px-2">Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-navy-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-50 border-b border-navy-100">
                <th className="px-3 py-3 w-8"><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="rounded border-navy-300" /></th>
                <th className="text-left px-4 py-3 font-semibold text-navy-700">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-navy-700 hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-navy-700 hidden lg:table-cell">Phone</th>
                <th className="text-left px-4 py-3 font-semibold text-navy-700">Flight</th>
                <th className="text-left px-4 py-3 font-semibold text-navy-700 hidden md:table-cell">Team</th>
                <th className="text-left px-4 py-3 font-semibold text-navy-700">Payment</th>
                <th className="text-left px-4 py-3 font-semibold text-navy-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-navy-400">{search || paymentFilter !== "all" || flightFilter !== "all" || teamFilter !== "all" ? "No matching players." : "No registrations yet."}</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id} className="border-b border-navy-50 hover:bg-navy-50/50">
                  <td className="px-3 py-3"><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="rounded border-navy-300" /></td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(p)} className="font-medium text-navy-900 hover:text-gold-600 text-left">
                      {p.fullName}
                      {p.returningPlayer && <span className="ml-1 text-xs text-gold-500">*</span>}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-navy-600 hidden sm:table-cell">{p.email}</td>
                  <td className="px-4 py-3 text-navy-600 hidden lg:table-cell">{p.phone}</td>
                  <td className="px-4 py-3 text-navy-600">{p.genderFlight}</td>
                  <td className="px-4 py-3 text-navy-600 hidden md:table-cell">{p.team?.name || <span className="text-navy-300">-</span>}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                      p.payment?.status === "paid_online" || p.payment?.status === "paid_manual" ? "bg-navy-100 text-navy-700" : "bg-red-100 text-red-700"
                    }`}>
                      {p.payment?.status === "paid_online" ? "Paid" : p.payment?.status === "paid_manual" ? "Paid" : "Unpaid"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {(!p.payment || p.payment.status === "unpaid") && (
                        <button onClick={() => updatePaymentStatus(p.id, "paid_manual")} className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded-lg font-medium">Paid</button>
                      )}
                      {(p.payment?.status === "paid_online" || p.payment?.status === "paid_manual") && (
                        <button onClick={() => updatePaymentStatus(p.id, "unpaid")} className="text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 px-2 py-1 rounded-lg">Unpaid</button>
                      )}
                      <button onClick={() => openEdit(p)} className="text-xs bg-navy-50 text-navy-600 hover:bg-navy-100 px-2 py-1 rounded-lg">Edit</button>
                      <button onClick={() => removePlayer(p.id)} className="text-xs text-red-500 hover:text-red-700 px-2 py-1">Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length !== players.length && (
          <div className="px-4 py-2 bg-navy-50 text-xs text-navy-500 border-t border-navy-100">
            Showing {filtered.length} of {players.length} players
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-navy-900 text-lg">Edit Player</h3>
            <div className="space-y-3">
              <div><label className="text-xs font-semibold text-navy-600 uppercase">Name</label><input className={inputClass} value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} /></div>
              <div><label className="text-xs font-semibold text-navy-600 uppercase">Email</label><input className={inputClass} value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div>
              <div><label className="text-xs font-semibold text-navy-600 uppercase">Phone</label><input className={inputClass} value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-navy-600 uppercase">Shirt</label>
                  <select className={inputClass} value={editForm.shirtSize} onChange={(e) => setEditForm({ ...editForm, shirtSize: e.target.value })}>
                    {["S","M","L","XL","XXL"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-semibold text-navy-600 uppercase">Flight</label>
                  <select className={inputClass} value={editForm.genderFlight} onChange={(e) => setEditForm({ ...editForm, genderFlight: e.target.value })}>
                    <option value="Men">Men</option><option value="Women">Women</option>
                  </select>
                </div>
              </div>
              <div><label className="text-xs font-semibold text-navy-600 uppercase">Team Preference</label><input className={inputClass} value={editForm.teamPreference} onChange={(e) => setEditForm({ ...editForm, teamPreference: e.target.value })} /></div>
              <div><label className="text-xs font-semibold text-navy-600 uppercase">Dietary Needs</label><input className={inputClass} value={editForm.dietaryNeeds} onChange={(e) => setEditForm({ ...editForm, dietaryNeeds: e.target.value })} /></div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={saveEdit} disabled={saving} className="flex-1 bg-gold-400 hover:bg-gold-300 text-navy-950 font-bold py-2.5 rounded-lg text-sm disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
              <button onClick={() => setEditing(null)} className="flex-1 bg-white border border-navy-200 text-navy-600 py-2.5 rounded-lg text-sm hover:bg-navy-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-navy-900 text-lg mb-4">Add Player</h3>
            <form onSubmit={addPlayer} className="space-y-3">
              <input className={inputClass} placeholder="Full name *" required value={addForm.fullName} onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })} />
              <input className={inputClass} type="email" placeholder="Email *" required value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} />
              <input className={inputClass} placeholder="Phone *" required value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <select className={inputClass} required value={addForm.shirtSize} onChange={(e) => setAddForm({ ...addForm, shirtSize: e.target.value })}>
                  <option value="">Shirt size *</option>{["S","M","L","XL","XXL"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select className={inputClass} required value={addForm.genderFlight} onChange={(e) => setAddForm({ ...addForm, genderFlight: e.target.value })}>
                  <option value="">Flight *</option><option value="Men">Men</option><option value="Women">Women</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-gold-400 hover:bg-gold-300 text-navy-950 font-bold py-2.5 rounded-lg text-sm disabled:opacity-50">{saving ? "Adding..." : "Add Player"}</button>
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 bg-white border border-navy-200 text-navy-600 py-2.5 rounded-lg text-sm hover:bg-navy-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
