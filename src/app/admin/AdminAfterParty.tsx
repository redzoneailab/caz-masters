"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

interface Registration {
  id: string;
  name: string;
  email: string;
  numGuests: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  playerId: string | null;
  createdAt: string;
}

interface Stats {
  totalHeadcount: number;
  totalRegistrations: number;
  paidCount: number;
  unpaidCount: number;
  revenue: number;
}

type PaymentFilter = "all" | "paid" | "unpaid";

export default function AdminAfterParty({ password }: { password: string }) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [stats, setStats] = useState<Stats>({ totalHeadcount: 0, totalRegistrations: 0, paidCount: 0, unpaidCount: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");

  // Edit modal
  const [editing, setEditing] = useState<Registration | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", numGuests: 1 });
  const [saving, setSaving] = useState(false);

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", numGuests: 1 });

  const headers = { Authorization: `Bearer ${password}`, "Content-Type": "application/json" };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/afterparty", { headers: { Authorization: `Bearer ${password}` } });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRegistrations(data.registrations);
      setStats(data.stats);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    let result = registrations;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
    }
    if (paymentFilter === "paid") result = result.filter((r) => r.paymentStatus === "paid_online" || r.paymentStatus === "paid_manual");
    if (paymentFilter === "unpaid") result = result.filter((r) => r.paymentStatus === "unpaid");
    return result;
  }, [registrations, search, paymentFilter]);

  async function updatePaymentStatus(id: string, paymentStatus: string) {
    try {
      await fetch(`/api/admin/afterparty/${id}`, { method: "PATCH", headers, body: JSON.stringify({ paymentStatus }) });
      await fetchData();
    } catch { setError("Failed to update"); }
  }

  async function deleteRegistration(id: string) {
    if (!confirm("Remove this registration?")) return;
    try {
      await fetch(`/api/admin/afterparty/${id}`, { method: "DELETE", headers });
      await fetchData();
    } catch { setError("Failed to delete"); }
  }

  function openEdit(r: Registration) {
    setEditing(r);
    setEditForm({ name: r.name, email: r.email, numGuests: r.numGuests });
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/afterparty/${editing.id}`, { method: "PATCH", headers, body: JSON.stringify(editForm) });
      setEditing(null);
      await fetchData();
    } catch { setError("Failed to save"); }
    finally { setSaving(false); }
  }

  async function addRegistration(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/afterparty", { method: "POST", headers, body: JSON.stringify(addForm) });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed"); setSaving(false); return; }
      setShowAdd(false);
      setAddForm({ name: "", email: "", numGuests: 1 });
      await fetchData();
    } catch { setError("Failed to add"); }
    finally { setSaving(false); }
  }

  const inputClass = "w-full border border-navy-200 rounded-lg px-3 py-2 text-sm";

  if (loading) return <p className="text-navy-500 py-8 text-center">Loading after party data...</p>;

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">
          {error} <button onClick={() => setError("")} className="ml-2 font-bold">&times;</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-gold-50 rounded-xl p-4 border border-gold-200">
          <p className="text-sm text-gold-700 font-semibold">Headcount</p>
          <p className="text-4xl font-black text-gold-600">{stats.totalHeadcount}</p>
          <p className="text-xs text-gold-500 mt-1">for catering</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-navy-100">
          <p className="text-sm text-navy-500">Registrations</p>
          <p className="text-3xl font-bold text-navy-900">{stats.totalRegistrations}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-navy-100">
          <p className="text-sm text-navy-500">Paid</p>
          <p className="text-3xl font-bold text-navy-900">{stats.paidCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-navy-100">
          <p className="text-sm text-red-600">Unpaid</p>
          <p className="text-3xl font-bold text-red-700">{stats.unpaidCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-navy-100">
          <p className="text-sm text-navy-500">Revenue</p>
          <p className="text-3xl font-bold text-navy-900">${(stats.revenue / 100).toFixed(0)}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2">
        <button onClick={fetchData} className="bg-white border border-navy-200 text-navy-600 px-4 py-2 rounded-lg text-sm hover:bg-navy-50">Refresh</button>
        <button onClick={() => setShowAdd(true)} className="bg-gold-400 hover:bg-gold-300 text-navy-950 font-bold px-4 py-2 rounded-lg text-sm">Add Registration</button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text" placeholder="Search name or email..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] border border-navy-200 rounded-lg px-3 py-2 text-sm focus:border-navy-500 focus:ring-1 focus:ring-navy-500/20 focus:outline-none"
        />
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)} className="border border-navy-200 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="all">All Payments</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-navy-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-50 border-b border-navy-100">
                <th className="text-left px-4 py-3 font-semibold text-navy-700">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-navy-700 hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-navy-700">Guests</th>
                <th className="text-left px-4 py-3 font-semibold text-navy-700">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-navy-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-navy-400">{search || paymentFilter !== "all" ? "No matching registrations." : "No registrations yet."}</td></tr>
              ) : filtered.map((reg) => (
                <tr key={reg.id} className="border-b border-navy-50 hover:bg-navy-50/50">
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(reg)} className="font-medium text-navy-900 hover:text-gold-600 text-left">
                      {reg.name}
                      {reg.playerId && <span className="ml-1 text-xs text-gold-500" title="Tournament player">*</span>}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-navy-600 hidden sm:table-cell">{reg.email}</td>
                  <td className="px-4 py-3 text-navy-900 font-semibold">{reg.numGuests}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                      reg.paymentStatus === "paid_online" || reg.paymentStatus === "paid_manual" ? "bg-navy-100 text-navy-700" : "bg-red-100 text-red-700"
                    }`}>
                      {reg.paymentStatus === "paid_online" ? "Paid" : reg.paymentStatus === "paid_manual" ? "Paid" : "Unpaid"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {reg.paymentStatus === "unpaid" && (
                        <button onClick={() => updatePaymentStatus(reg.id, "paid_manual")} className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded-lg font-medium">Paid</button>
                      )}
                      {(reg.paymentStatus === "paid_online" || reg.paymentStatus === "paid_manual") && (
                        <button onClick={() => updatePaymentStatus(reg.id, "unpaid")} className="text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 px-2 py-1 rounded-lg">Unpaid</button>
                      )}
                      <button onClick={() => openEdit(reg)} className="text-xs bg-navy-50 text-navy-600 hover:bg-navy-100 px-2 py-1 rounded-lg">Edit</button>
                      <button onClick={() => deleteRegistration(reg.id)} className="text-xs text-red-500 hover:text-red-700 px-2 py-1">Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length !== registrations.length && (
          <div className="px-4 py-2 bg-navy-50 text-xs text-navy-500 border-t border-navy-100">
            Showing {filtered.length} of {registrations.length} registrations
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-navy-900 text-lg">Edit Registration</h3>
            <div className="space-y-3">
              <div><label className="text-xs font-semibold text-navy-600 uppercase">Name</label><input className={inputClass} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
              <div><label className="text-xs font-semibold text-navy-600 uppercase">Email</label><input className={inputClass} value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div>
              <div>
                <label className="text-xs font-semibold text-navy-600 uppercase">Guests</label>
                <input type="number" min={1} max={20} className={inputClass} value={editForm.numGuests} onChange={(e) => setEditForm({ ...editForm, numGuests: parseInt(e.target.value) || 1 })} />
              </div>
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
            <h3 className="font-bold text-navy-900 text-lg mb-4">Add Registration</h3>
            <form onSubmit={addRegistration} className="space-y-3">
              <input className={inputClass} placeholder="Full name *" required value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} />
              <input className={inputClass} type="email" placeholder="Email *" required value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} />
              <div>
                <label className="text-xs font-semibold text-navy-600 uppercase">Guests</label>
                <input type="number" min={1} max={20} className={inputClass} value={addForm.numGuests} onChange={(e) => setAddForm({ ...addForm, numGuests: parseInt(e.target.value) || 1 })} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-gold-400 hover:bg-gold-300 text-navy-950 font-bold py-2.5 rounded-lg text-sm disabled:opacity-50">{saving ? "Adding..." : "Add"}</button>
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 bg-white border border-navy-200 text-navy-600 py-2.5 rounded-lg text-sm hover:bg-navy-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
