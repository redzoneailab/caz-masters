"use client";

import { useState, useEffect, useCallback } from "react";

interface HoFEntry {
  id: string;
  year: number;
  category: string;
  winnerName: string;
  teamName: string | null;
  description: string | null;
  score: number | null;
}

const CATEGORIES = [
  { value: "mens_individual", label: "Men's Champion" },
  { value: "womens_individual", label: "Women's Champion" },
  { value: "senior_individual", label: "Senior Champion" },
  { value: "team", label: "Winning Team" },
  { value: "shotgun_champion", label: "Shotgun Champion" },
  { value: "special_award", label: "Special Award" },
  { value: "fan_vote", label: "Fan Vote" },
];

const YEARS = Array.from({ length: 15 }, (_, i) => 2026 - i);

export default function AdminHallOfFame({ password }: { password: string }) {
  const [entries, setEntries] = useState<HoFEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add form
  const [year, setYear] = useState(2025);
  const [category, setCategory] = useState("mens_individual");
  const [winnerName, setWinnerName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const [score, setScore] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit modal
  const [editing, setEditing] = useState<HoFEntry | null>(null);
  const [editForm, setEditForm] = useState({ year: 2025, category: "", winnerName: "", teamName: "", description: "", score: "" });

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${password}`,
  };

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/hall-of-fame", {
        headers: { Authorization: `Bearer ${password}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEntries(data.entries);
    } catch {
      setError("Failed to load entries");
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  async function addEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!winnerName.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/hall-of-fame", {
        method: "POST",
        headers,
        body: JSON.stringify({
          year,
          category,
          winnerName: winnerName.trim(),
          teamName: teamName.trim() || undefined,
          description: description.trim() || undefined,
          score: score ? parseInt(score) : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add entry");
        return;
      }
      setWinnerName("");
      setTeamName("");
      setDescription("");
      setScore("");
      await fetchEntries();
    } catch {
      setError("Failed to add entry");
    } finally {
      setSaving(false);
    }
  }

  function openEdit(entry: HoFEntry) {
    setEditing(entry);
    setEditForm({
      year: entry.year,
      category: entry.category,
      winnerName: entry.winnerName,
      teamName: entry.teamName || "",
      description: entry.description || "",
      score: entry.score != null ? String(entry.score) : "",
    });
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/hall-of-fame/${editing.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          year: editForm.year,
          category: editForm.category,
          winnerName: editForm.winnerName,
          teamName: editForm.teamName || null,
          description: editForm.description || null,
          score: editForm.score ? parseInt(editForm.score) : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }
      setEditing(null);
      await fetchEntries();
    } catch {
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(id: string) {
    if (!confirm("Delete this entry?")) return;
    try {
      await fetch(`/api/admin/hall-of-fame/${id}`, {
        method: "DELETE",
        headers,
      });
      await fetchEntries();
    } catch {
      setError("Failed to delete entry");
    }
  }

  if (loading) return <p className="text-navy-500 py-8 text-center">Loading entries...</p>;

  const byYear = entries.reduce<Record<number, HoFEntry[]>>((acc, e) => {
    if (!acc[e.year]) acc[e.year] = [];
    acc[e.year].push(e);
    return acc;
  }, {});

  const inputClass = "w-full border border-navy-200 rounded-lg px-3 py-2 text-sm";

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">
          {error}
          <button onClick={() => setError("")} className="ml-2 font-bold">&times;</button>
        </div>
      )}

      {/* Add entry form */}
      <div className="bg-white rounded-xl border border-navy-100 p-5">
        <h3 className="font-bold text-navy-900 mb-4">Add Hall of Fame Entry</h3>
        <form onSubmit={addEntry} className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="border border-navy-200 rounded-lg px-3 py-2 text-sm"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border border-navy-200 rounded-lg px-3 py-2 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={winnerName}
              onChange={(e) => setWinnerName(e.target.value)}
              placeholder="Winner name *"
              className="border border-navy-200 rounded-lg px-3 py-2 text-sm"
              required
            />
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Team name (optional)"
              className="border border-navy-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-3">
            <input
              type="number"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder={
                category === "team"
                  ? "Stableford pts"
                  : category === "mens_individual" || category === "womens_individual"
                  ? "Total strokes"
                  : "Score (optional)"
              }
              className="w-36 border border-navy-200 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="flex-1 border border-navy-200 rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={saving}
              className="bg-gold-400 hover:bg-gold-300 text-navy-950 font-bold px-6 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add"}
            </button>
          </div>
        </form>
      </div>

      {/* Existing entries by year */}
      {Object.keys(byYear)
        .map(Number)
        .sort((a, b) => b - a)
        .map((yr) => (
          <div key={yr} className="bg-white rounded-xl border border-navy-100 overflow-hidden">
            <div className="bg-navy-50 px-5 py-3 border-b border-navy-100">
              <h3 className="font-bold text-navy-900">{yr}</h3>
            </div>
            <div className="divide-y divide-navy-50">
              {byYear[yr].map((entry) => (
                <div key={entry.id} className="flex items-center justify-between px-5 py-3">
                  <button onClick={() => openEdit(entry)} className="text-left flex-1 hover:bg-navy-50/50 -mx-2 px-2 py-1 rounded-lg transition-colors">
                    <span className="text-xs font-bold text-gold-500 uppercase">
                      {CATEGORIES.find((c) => c.value === entry.category)?.label || entry.category}
                    </span>
                    <p className="text-sm text-navy-800 font-medium">
                      {entry.winnerName}
                      {entry.teamName && <span className="text-navy-500"> - {entry.teamName}</span>}
                      {entry.score != null && (
                        <span className="text-navy-500 ml-1">
                          ({entry.category === "team"
                            ? `${entry.score} Stableford pts`
                            : entry.category === "shotgun_champion"
                            ? `${entry.score} beers`
                            : `${entry.score} strokes`})
                        </span>
                      )}
                    </p>
                    {entry.description && (
                      <p className="text-xs text-navy-400">{entry.description}</p>
                    )}
                  </button>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => openEdit(entry)}
                      className="text-xs bg-navy-50 text-navy-600 hover:bg-navy-100 px-3 py-1.5 rounded-lg"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

      {entries.length === 0 && (
        <p className="text-navy-400 text-sm text-center py-8">
          No Hall of Fame entries yet. Use the form above to add past winners.
        </p>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-navy-900 text-lg">Edit Hall of Fame Entry</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-navy-600 uppercase">Year</label>
                  <select className={inputClass} value={editForm.year} onChange={(e) => setEditForm({ ...editForm, year: parseInt(e.target.value) })}>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-navy-600 uppercase">Category</label>
                  <select className={inputClass} value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-navy-600 uppercase">Winner Name</label>
                <input className={inputClass} value={editForm.winnerName} onChange={(e) => setEditForm({ ...editForm, winnerName: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-navy-600 uppercase">Team Name</label>
                <input className={inputClass} value={editForm.teamName} onChange={(e) => setEditForm({ ...editForm, teamName: e.target.value })} placeholder="Optional" />
              </div>
              <div>
                <label className="text-xs font-semibold text-navy-600 uppercase">Score</label>
                <input type="number" className={inputClass} value={editForm.score} onChange={(e) => setEditForm({ ...editForm, score: e.target.value })} placeholder="Optional" />
              </div>
              <div>
                <label className="text-xs font-semibold text-navy-600 uppercase">Description</label>
                <input className={inputClass} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Optional" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={saveEdit} disabled={saving} className="flex-1 bg-gold-400 hover:bg-gold-300 text-navy-950 font-bold py-2.5 rounded-lg text-sm disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={() => setEditing(null)} className="flex-1 bg-white border border-navy-200 text-navy-600 py-2.5 rounded-lg text-sm hover:bg-navy-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
