"use client";

import { useState, useEffect, useCallback } from "react";

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

export default function AdminAfterParty({ password }: { password: string }) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [stats, setStats] = useState<Stats>({ totalHeadcount: 0, totalRegistrations: 0, paidCount: 0, unpaidCount: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      setError("Failed to load after party data");
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function updatePaymentStatus(id: string, paymentStatus: string) {
    try {
      await fetch(`/api/admin/afterparty/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ paymentStatus }),
      });
      await fetchData();
    } catch {
      setError("Failed to update payment status");
    }
  }

  async function deleteRegistration(id: string) {
    try {
      await fetch(`/api/admin/afterparty/${id}`, { method: "DELETE", headers });
      await fetchData();
    } catch {
      setError("Failed to delete registration");
    }
  }

  if (loading) return <p className="text-navy-500 py-8 text-center">Loading after party data...</p>;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">
          {error}
          <button onClick={() => setError("")} className="ml-2 font-bold">&times;</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-navy-900">After Party</h2>
        <button onClick={fetchData} className="bg-white border border-navy-200 text-navy-600 px-4 py-2 rounded-lg text-sm hover:bg-navy-50">
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-gold-50 rounded-xl p-4 border border-gold-200 sm:col-span-1">
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

      {/* Registrations table */}
      <div className="bg-white rounded-xl border border-navy-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-50 border-b border-navy-100">
                <th className="text-left px-4 py-3 font-semibold text-navy-700">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-navy-700 hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-navy-700">Guests</th>
                <th className="text-left px-4 py-3 font-semibold text-navy-700">Total</th>
                <th className="text-left px-4 py-3 font-semibold text-navy-700">Method</th>
                <th className="text-left px-4 py-3 font-semibold text-navy-700">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-navy-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-navy-400">No registrations yet.</td>
                </tr>
              ) : (
                registrations.map((reg) => (
                  <tr key={reg.id} className="border-b border-navy-50 hover:bg-navy-50/50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-navy-900">{reg.name}</span>
                      {reg.playerId && (
                        <span className="ml-1 text-xs text-gold-500" title="Tournament player">*</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-navy-600 hidden sm:table-cell">{reg.email}</td>
                    <td className="px-4 py-3 text-navy-900 font-semibold">{reg.numGuests}</td>
                    <td className="px-4 py-3 text-navy-900 font-semibold">${(reg.totalAmount / 100).toFixed(0)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${reg.paymentMethod === "stripe" ? "text-blue-600" : "text-navy-500"}`}>
                        {reg.paymentMethod === "stripe" ? "Online" : "At Door"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                        reg.paymentStatus === "paid_online" || reg.paymentStatus === "paid_manual"
                          ? "bg-navy-100 text-navy-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {reg.paymentStatus === "paid_online" ? "Paid Online"
                          : reg.paymentStatus === "paid_manual" ? "Paid Manual"
                            : "Unpaid"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {reg.paymentStatus === "unpaid" && (
                          <button
                            onClick={() => updatePaymentStatus(reg.id, "paid_manual")}
                            className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium"
                          >
                            Mark Paid
                          </button>
                        )}
                        {(reg.paymentStatus === "paid_online" || reg.paymentStatus === "paid_manual") && (
                          <button
                            onClick={() => updatePaymentStatus(reg.id, "unpaid")}
                            className="text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-lg"
                          >
                            Mark Unpaid
                          </button>
                        )}
                        <button
                          onClick={() => deleteRegistration(reg.id)}
                          className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
