"use client";

import { useState, useEffect, useCallback } from "react";

interface Donation {
  id: string;
  amount: number;
  donorName: string | null;
  donorEmail: string | null;
  dedicatedTo: string | null;
  message: string | null;
  status: string;
  createdAt: string;
}

export default function AdminDonations({ password }: { password: string }) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/donations", {
        headers: { Authorization: `Bearer ${password}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDonations(data.donations);
      setTotalCompleted(data.totalCompleted);
    } catch {
      setError("Failed to load donations");
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => { fetchDonations(); }, [fetchDonations]);

  if (loading) return <p className="text-navy-500 py-8 text-center">Loading donations...</p>;

  const completedCount = donations.filter((d) => d.status === "completed").length;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-navy-900">Donations</h2>
        <button onClick={fetchDonations} className="bg-white border border-navy-200 text-navy-600 px-4 py-2 rounded-lg text-sm hover:bg-navy-50">
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-navy-100">
          <p className="text-sm text-navy-500">Total Raised</p>
          <p className="text-3xl font-bold text-navy-900">${(totalCompleted / 100).toFixed(0)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-navy-100">
          <p className="text-sm text-navy-500">Completed</p>
          <p className="text-3xl font-bold text-navy-900">{completedCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-navy-100">
          <p className="text-sm text-navy-500">Pending</p>
          <p className="text-3xl font-bold text-navy-900">{donations.length - completedCount}</p>
        </div>
      </div>

      {/* Donations table */}
      <div className="bg-white rounded-xl border border-navy-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-50 border-b border-navy-100">
                <th className="text-left px-4 py-3 font-semibold text-navy-700">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-navy-700">Donor</th>
                <th className="text-left px-4 py-3 font-semibold text-navy-700">Amount</th>
                <th className="text-left px-4 py-3 font-semibold text-navy-700 hidden sm:table-cell">Dedicated To</th>
                <th className="text-left px-4 py-3 font-semibold text-navy-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {donations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-navy-400">
                    No donations yet.
                  </td>
                </tr>
              ) : (
                donations.map((d) => (
                  <tr key={d.id} className="border-b border-navy-50 hover:bg-navy-50/50">
                    <td className="px-4 py-3 text-navy-600">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-navy-800 font-medium">
                      {d.donorName || "Anonymous"}
                      {d.donorEmail && (
                        <span className="block text-xs text-navy-400">{d.donorEmail}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-navy-900 font-semibold">
                      ${(d.amount / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-navy-600 hidden sm:table-cell">
                      {d.dedicatedTo || "-"}
                      {d.message && (
                        <span className="block text-xs text-navy-400 italic">&quot;{d.message}&quot;</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                          d.status === "completed"
                            ? "bg-navy-100 text-navy-700"
                            : "bg-gold-50 text-gold-600"
                        }`}
                      >
                        {d.status === "completed" ? "Completed" : "Pending"}
                      </span>
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
