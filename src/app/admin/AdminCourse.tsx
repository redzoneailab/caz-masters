"use client";

import { useState, useEffect, useCallback } from "react";

interface TeeBoxEntry {
  id: string;
  name: string;
  par: number;
  yardage: number | null;
}

interface CourseHole {
  id: string;
  holeNumber: number;
  notes: string | null;
  active: boolean;
  teeBoxes: TeeBoxEntry[];
}

interface Course {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  holes: CourseHole[];
}

interface ScorerPinEntry {
  id: string;
  pin: string;
  player: { id: string; fullName: string; teamId: string | null; team: { name: string } | null };
}

interface SearchResult {
  id: string;
  clubName: string;
  courseName: string;
  city: string;
  state: string;
  country: string;
}

export default function AdminCourse({ password }: { password: string }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [pins, setPins] = useState<ScorerPinEntry[]>([]);
  const [tournamentId, setTournamentId] = useState("");
  const [numHoles, setNumHoles] = useState(18);
  const [shotgunStart, setShotgunStart] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingHole, setEditingHole] = useState<string | null>(null);

  // Course search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState(false);

  // New PIN form
  const [newPinPlayerId, setNewPinPlayerId] = useState("");
  const [newPinValue, setNewPinValue] = useState("");
  const [players, setPlayers] = useState<{ id: string; fullName: string }[]>([]);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${password}`,
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [courseRes, pinsRes, playersRes] = await Promise.all([
        fetch("/api/admin/course", { headers: { Authorization: `Bearer ${password}` } }),
        fetch("/api/admin/scorer-pins", { headers: { Authorization: `Bearer ${password}` } }),
        fetch("/api/admin/players", { headers: { Authorization: `Bearer ${password}` } }),
      ]);

      if (courseRes.ok) {
        const data = await courseRes.json();
        setCourse(data.course);
        setTournamentId(data.tournamentId || "");
        setNumHoles(data.numHoles || 18);
        setShotgunStart(data.shotgunStart ?? true);
      }
      if (pinsRes.ok) {
        const data = await pinsRes.json();
        setPins(data.pins);
        if (!tournamentId) setTournamentId(data.tournamentId || "");
      }
      if (playersRes.ok) {
        const data = await playersRes.json();
        setPlayers(data.players.map((p: { id: string; fullName: string }) => ({ id: p.id, fullName: p.fullName })));
      }
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [password, tournamentId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function seedCourse() {
    setError("");
    try {
      const res = await fetch("/api/admin/course", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "seed-cazenovia" }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to seed course");
        return;
      }
      await fetchData();
    } catch {
      setError("Failed to seed course");
    }
  }

  async function searchCourses(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/course/search?q=${encodeURIComponent(searchQuery.trim())}`,
        { headers: { Authorization: `Bearer ${password}` } }
      );
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Search failed");
        return;
      }
      const data = await res.json();
      setSearchResults(data.courses || []);
      if ((data.courses || []).length === 0) {
        setError("No courses found. Try a different search term.");
      }
    } catch {
      setError("Search failed");
    } finally {
      setSearching(false);
    }
  }

  async function importCourse(courseId: string) {
    setImporting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/course/import", {
        method: "POST",
        headers,
        body: JSON.stringify({ courseId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Import failed");
        return;
      }
      setSearchResults([]);
      setSearchQuery("");
      await fetchData();
    } catch {
      setError("Import failed");
    } finally {
      setImporting(false);
    }
  }

  async function updateHole(holeId: string, updates: Record<string, unknown>) {
    try {
      await fetch(`/api/admin/course/holes/${holeId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(updates),
      });
      await fetchData();
      setEditingHole(null);
    } catch {
      setError("Failed to update hole");
    }
  }

  async function updateTeeBox(holeId: string, teeBox: { id: string; par?: number; yardage?: number | null }) {
    try {
      await fetch(`/api/admin/course/holes/${holeId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ teeBoxes: [teeBox] }),
      });
      await fetchData();
    } catch {
      setError("Failed to update tee box");
    }
  }

  async function updateNumHoles(value: number) {
    try {
      await fetch("/api/admin/course", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "set-num-holes", numHoles: value }),
      });
      setNumHoles(value);
    } catch {
      setError("Failed to update hole count");
    }
  }

  async function toggleShotgunStart() {
    const newVal = !shotgunStart;
    try {
      await fetch("/api/admin/tournament", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ shotgunStart: newVal }),
      });
      setShotgunStart(newVal);
    } catch {
      setError("Failed to update shotgun start");
    }
  }

  async function addPin(e: React.FormEvent) {
    e.preventDefault();
    if (!newPinPlayerId || !newPinValue) return;
    try {
      const res = await fetch("/api/admin/scorer-pins", {
        method: "POST",
        headers,
        body: JSON.stringify({ playerId: newPinPlayerId, pin: newPinValue, tournamentId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add PIN");
        return;
      }
      setNewPinPlayerId("");
      setNewPinValue("");
      await fetchData();
    } catch {
      setError("Failed to add PIN");
    }
  }

  async function deletePin(pinId: string) {
    try {
      await fetch(`/api/admin/scorer-pins?id=${pinId}`, { method: "DELETE", headers });
      await fetchData();
    } catch {
      setError("Failed to delete PIN");
    }
  }

  if (loading) return <p className="text-navy-500 py-8 text-center">Loading...</p>;

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      {/* Tournament Settings */}
      <div>
        <h2 className="text-lg font-bold text-navy-900 mb-4">Tournament Settings</h2>
        <div className="bg-white rounded-xl border border-navy-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-navy-900">Hole Count</p>
              <p className="text-xs text-navy-500">Number of holes for this tournament</p>
            </div>
            <select
              value={numHoles}
              onChange={(e) => updateNumHoles(parseInt(e.target.value))}
              className="border border-navy-200 rounded-lg px-3 py-1.5 text-sm"
            >
              {Array.from({ length: 18 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n} holes</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-navy-900">Shotgun Start</p>
              <p className="text-xs text-navy-500">
                {shotgunStart
                  ? "Teams start on different holes simultaneously"
                  : "All teams start on hole 1"}
              </p>
            </div>
            <button
              onClick={toggleShotgunStart}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                shotgunStart ? "bg-gold-400" : "bg-navy-200"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  shotgunStart ? "translate-x-6" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Course Data */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-navy-900">Course Configuration</h2>
          <button onClick={fetchData} className="bg-white border border-navy-200 text-navy-600 px-4 py-2 rounded-lg text-sm hover:bg-navy-50">
            Refresh
          </button>
        </div>

        {!course ? (
          <div className="space-y-4">
            {/* Course Search */}
            <div className="bg-white rounded-xl border border-navy-100 p-5">
              <h3 className="text-sm font-bold text-navy-900 mb-3">Import from Golf Course API</h3>
              <form onSubmit={searchCourses} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by course name..."
                  className="flex-1 border border-navy-200 rounded-lg px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="bg-navy-800 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-navy-700 disabled:opacity-50"
                >
                  {searching ? "Searching..." : "Search"}
                </button>
              </form>
              {searchResults.length > 0 && (
                <div className="mt-3 divide-y divide-navy-50 border border-navy-100 rounded-lg overflow-hidden">
                  {searchResults.map((r) => (
                    <div key={r.id} className="flex items-center justify-between px-4 py-3 hover:bg-navy-50">
                      <div>
                        <p className="text-sm font-medium text-navy-900">
                          {r.clubName}{r.courseName && r.courseName !== r.clubName ? ` — ${r.courseName}` : ""}
                        </p>
                        <p className="text-xs text-navy-500">{[r.city, r.state, r.country].filter(Boolean).join(", ")}</p>
                      </div>
                      <button
                        onClick={() => importCourse(r.id)}
                        disabled={importing}
                        className="bg-gold-400 hover:bg-gold-300 text-navy-950 font-bold px-3 py-1.5 rounded-lg text-xs disabled:opacity-50"
                      >
                        {importing ? "Importing..." : "Import"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Or Seed Cazenovia */}
            <div className="bg-white rounded-xl border border-navy-100 p-5 text-center">
              <p className="text-navy-500 text-sm mb-3">Or set up manually:</p>
              <button
                onClick={seedCourse}
                className="bg-gold-400 hover:bg-gold-300 text-navy-950 font-bold px-6 py-2.5 rounded-lg transition-colors"
              >
                Seed Cazenovia Golf Club (18 holes, 3 tee sets)
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Course search when course already exists */}
            <div className="bg-white rounded-xl border border-navy-100 p-4">
              <form onSubmit={searchCourses} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Replace course — search by name..."
                  className="flex-1 border border-navy-200 rounded-lg px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="bg-navy-800 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-navy-700 disabled:opacity-50"
                >
                  {searching ? "Searching..." : "Search"}
                </button>
              </form>
              {searchResults.length > 0 && (
                <div className="mt-3 divide-y divide-navy-50 border border-navy-100 rounded-lg overflow-hidden">
                  {searchResults.map((r) => (
                    <div key={r.id} className="flex items-center justify-between px-4 py-3 hover:bg-navy-50">
                      <div>
                        <p className="text-sm font-medium text-navy-900">
                          {r.clubName}{r.courseName && r.courseName !== r.clubName ? ` — ${r.courseName}` : ""}
                        </p>
                        <p className="text-xs text-navy-500">{[r.city, r.state, r.country].filter(Boolean).join(", ")}</p>
                      </div>
                      <button
                        onClick={() => importCourse(r.id)}
                        disabled={importing}
                        className="bg-gold-400 hover:bg-gold-300 text-navy-950 font-bold px-3 py-1.5 rounded-lg text-xs disabled:opacity-50"
                      >
                        {importing ? "Importing..." : "Import"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Course table */}
            <div className="bg-white rounded-xl border border-navy-100 overflow-hidden">
              <div className="bg-navy-50 px-5 py-3 border-b border-navy-100">
                <h3 className="font-bold text-navy-900">{course.name}</h3>
                <p className="text-xs text-navy-500">
                  {course.city}, {course.state} &middot; {course.holes.length} holes &middot;{" "}
                  {(() => {
                    const teeNames = [...new Set(course.holes.flatMap((h) => h.teeBoxes.map((t) => t.name)))];
                    return teeNames.map((name) => {
                      const total = course.holes.reduce((s, h) => {
                        const tb = h.teeBoxes.find((t) => t.name === name);
                        return s + (tb?.par || 0);
                      }, 0);
                      return total > 0 ? `${name}: Par ${total}` : null;
                    }).filter(Boolean).join(" · ");
                  })()}
                </p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-100 text-navy-600">
                    <th className="text-left px-4 py-2">Hole</th>
                    <th className="text-left px-4 py-2">Tee Boxes</th>
                    <th className="text-center px-4 py-2">Active</th>
                    <th className="text-right px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {course.holes.map((hole) => (
                    <tr key={hole.id} className={`border-b border-navy-50 ${!hole.active ? "opacity-50" : ""}`}>
                      <td className="px-4 py-2 font-bold text-navy-900">{hole.holeNumber}</td>
                      <td className="px-4 py-2">
                        {editingHole === hole.id ? (
                          <div className="space-y-1.5">
                            {hole.teeBoxes.map((tb) => (
                              <div key={tb.id} className="flex items-center gap-2">
                                <span className="text-xs font-medium text-navy-600 w-14">{tb.name}</span>
                                <span className="text-xs text-navy-500">Par</span>
                                <input
                                  type="number"
                                  defaultValue={tb.par}
                                  min={3}
                                  max={5}
                                  className="w-12 border rounded px-1 py-0.5 text-center text-sm"
                                  onBlur={(e) => updateTeeBox(hole.id, { id: tb.id, par: parseInt(e.target.value) })}
                                />
                                <span className="text-xs text-navy-500">Yds</span>
                                <input
                                  type="number"
                                  defaultValue={tb.yardage || ""}
                                  className="w-16 border rounded px-1 py-0.5 text-center text-sm"
                                  onBlur={(e) => updateTeeBox(hole.id, { id: tb.id, yardage: parseInt(e.target.value) || null })}
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                            {hole.teeBoxes.map((tb) => (
                              <span key={tb.id} className="text-xs text-navy-600">
                                <span className="font-medium">{tb.name}:</span> Par {tb.par}{tb.yardage ? `, ${tb.yardage}y` : ""}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => updateHole(hole.id, { active: !hole.active })}
                          className={`text-xs px-2 py-0.5 rounded ${hole.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                        >
                          {hole.active ? "Yes" : "No"}
                        </button>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => setEditingHole(editingHole === hole.id ? null : hole.id)}
                          className="text-xs text-navy-500 hover:text-navy-700"
                        >
                          {editingHole === hole.id ? "Done" : "Edit"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Scorer PINs */}
      <div>
        <h2 className="text-lg font-bold text-navy-900 mb-4">Scorer PINs</h2>

        <form onSubmit={addPin} className="bg-white rounded-xl border border-navy-100 p-5 mb-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-navy-600 mb-1">Player</label>
              <select
                value={newPinPlayerId}
                onChange={(e) => setNewPinPlayerId(e.target.value)}
                className="w-full border border-navy-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select a player...</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>{p.fullName}</option>
                ))}
              </select>
            </div>
            <div className="w-32">
              <label className="block text-xs font-medium text-navy-600 mb-1">PIN</label>
              <input
                type="text"
                value={newPinValue}
                onChange={(e) => setNewPinValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="4+ digits"
                className="w-full border border-navy-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="bg-gold-400 hover:bg-gold-300 text-navy-950 font-bold px-4 py-2 rounded-lg text-sm"
            >
              Add
            </button>
          </div>
        </form>

        {pins.length === 0 ? (
          <p className="text-navy-400 text-sm">No scorer PINs set. Add PINs for designated scorers.</p>
        ) : (
          <div className="bg-white rounded-xl border border-navy-100 divide-y divide-navy-50">
            {pins.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-navy-900">{entry.player.fullName}</p>
                  <p className="text-xs text-navy-500">
                    {entry.player.team ? `Team: ${entry.player.team.name}` : "No team"} &middot; PIN: {entry.pin}
                  </p>
                </div>
                <button
                  onClick={() => deletePin(entry.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
