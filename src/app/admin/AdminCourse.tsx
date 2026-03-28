"use client";

import { useState, useEffect, useCallback } from "react";
import type { TeeAssignments, FlightTeeConfig } from "@/lib/tees";

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

interface TeamScorerInfo {
  id: string;
  name: string;
  activeScorerName: string | null;
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
  const [tournamentId, setTournamentId] = useState("");
  const [numHoles, setNumHoles] = useState(18);
  const [shotgunStart, setShotgunStart] = useState(true);
  const [teeAssignments, setTeeAssignments] = useState<TeeAssignments>({});
  const [scorerPin, setScorerPin] = useState("");
  const [teamScorers, setTeamScorers] = useState<TeamScorerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingHole, setEditingHole] = useState<string | null>(null);

  // Course search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState(false);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${password}`,
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [courseRes, teamsRes] = await Promise.all([
        fetch("/api/admin/course", { headers: { Authorization: `Bearer ${password}` } }),
        fetch("/api/admin/teams", { headers: { Authorization: `Bearer ${password}` } }),
      ]);

      if (courseRes.ok) {
        const data = await courseRes.json();
        setCourse(data.course);
        setTournamentId(data.tournamentId || "");
        setNumHoles(data.numHoles || 18);
        setShotgunStart(data.shotgunStart ?? true);
        setTeeAssignments(data.teeAssignments || {});
        setScorerPin(data.scorerPin || "");
      }
      if (teamsRes.ok) {
        const data = await teamsRes.json();
        if (!tournamentId) setTournamentId(data.tournamentId || "");
        setTeamScorers(
          data.teams.map((t: { id: string; name: string; activeScorerName: string | null }) => ({
            id: t.id,
            name: t.name,
            activeScorerName: t.activeScorerName,
          }))
        );
      }
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [password, tournamentId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Collect all unique tee names across the course
  const allTeeNames = course
    ? [...new Set(course.holes.flatMap((h) => h.teeBoxes.map((t) => t.name)))].sort()
    : [];

  // Get tee names available for a specific hole
  function holeTeeNames(holeNumber: number): string[] {
    const hole = course?.holes.find((h) => h.holeNumber === holeNumber);
    return hole ? hole.teeBoxes.map((t) => t.name) : [];
  }

  // Resolve which tee is active for a flight on a given hole
  function resolvedTee(flight: string, holeNumber: number): string {
    const config = teeAssignments[flight];
    const override = config?.holes?.[String(holeNumber)];
    if (override) return override;
    return config?.default || "";
  }

  async function saveTeeAssignments(updated: TeeAssignments) {
    setTeeAssignments(updated);
    try {
      await fetch("/api/admin/tournament", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ teeAssignments: updated }),
      });
    } catch {
      setError("Failed to save tee assignments");
    }
  }

  function updateFlightDefault(flight: string, teeName: string) {
    const current = teeAssignments[flight] || {};
    const updated: TeeAssignments = {
      ...teeAssignments,
      [flight]: { ...current, default: teeName, holes: current.holes || {} },
    };
    saveTeeAssignments(updated);
  }

  function applyQuickAssign(flight: string, mode: "all" | "front-back", frontTee: string, backTee?: string) {
    const holes: Record<string, string> = {};
    if (mode === "front-back" && backTee) {
      // Set default to front tee, override back 9 holes individually
      for (let h = Math.ceil(numHoles / 2) + 1; h <= numHoles; h++) {
        holes[String(h)] = backTee;
      }
    }
    const updated: TeeAssignments = {
      ...teeAssignments,
      [flight]: { default: frontTee, holes },
    };
    saveTeeAssignments(updated);
  }

  function updateHoleOverride(flight: string, holeNumber: number, teeName: string) {
    const current: FlightTeeConfig = teeAssignments[flight] || {};
    const currentHoles = { ...(current.holes || {}) };

    // If it matches the default, remove the override
    if (teeName === (current.default || "")) {
      delete currentHoles[String(holeNumber)];
    } else {
      currentHoles[String(holeNumber)] = teeName;
    }

    const updated: TeeAssignments = {
      ...teeAssignments,
      [flight]: { ...current, holes: currentHoles },
    };
    saveTeeAssignments(updated);
  }

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

  async function saveScorerPin(newPin: string) {
    try {
      await fetch("/api/admin/tournament", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ scorerPin: newPin }),
      });
      setScorerPin(newPin);
    } catch {
      setError("Failed to save scorer PIN");
    }
  }

  async function unlockTeamScorer(teamId: string) {
    try {
      await fetch(`/api/admin/teams/${teamId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ unlockScorer: true }),
      });
      await fetchData();
    } catch {
      setError("Failed to unlock scorer");
    }
  }

  if (loading) return <p className="text-navy-500 py-8 text-center">Loading...</p>;

  const flights = ["Men", "Women"];
  const halfPoint = Math.ceil(numHoles / 2);

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

            {/* Tee Assignments — Quick Assign */}
            {allTeeNames.length > 1 && (
              <div className="bg-white rounded-xl border border-navy-100 p-5">
                <h3 className="text-sm font-bold text-navy-900 mb-4">Tee Assignments by Flight</h3>
                <div className="space-y-5">
                  {flights.map((flight) => {
                    const config = teeAssignments[flight] || {};
                    const hasOverrides = Object.keys(config.holes || {}).length > 0;
                    // Detect front/back split pattern
                    const isSplit = hasOverrides && (() => {
                      const overrideValues = Object.entries(config.holes || {});
                      const backHoles = overrideValues.filter(([h]) => Number(h) > halfPoint);
                      return backHoles.length > 0 && backHoles.length === overrideValues.length
                        && backHoles.every(([, v]) => v === backHoles[0][1]);
                    })();
                    const backTee = isSplit
                      ? Object.values(config.holes || {})[0]
                      : "";

                    return (
                      <div key={flight}>
                        <p className="text-xs font-semibold text-navy-600 uppercase tracking-wider mb-2">{flight}&apos;s Flight</p>
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Quick assign: All holes */}
                          <button
                            onClick={() => {
                              const tee = config.default || allTeeNames[0];
                              applyQuickAssign(flight, "all", tee);
                            }}
                            className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                              config.default && !hasOverrides
                                ? "border-gold-400 bg-gold-50 text-gold-700 font-semibold"
                                : "border-navy-200 text-navy-500 hover:bg-navy-50"
                            }`}
                          >
                            All holes
                          </button>
                          <button
                            onClick={() => {
                              const front = config.default || allTeeNames[0];
                              const back = backTee || (allTeeNames.length > 1 ? allTeeNames[1] : allTeeNames[0]);
                              applyQuickAssign(flight, "front-back", front, back);
                            }}
                            className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                              isSplit
                                ? "border-gold-400 bg-gold-50 text-gold-700 font-semibold"
                                : "border-navy-200 text-navy-500 hover:bg-navy-50"
                            }`}
                          >
                            Front / Back split
                          </button>
                          <span className="text-navy-300">|</span>

                          {(!hasOverrides || !isSplit) ? (
                            /* All holes: single dropdown */
                            <select
                              value={config.default || ""}
                              onChange={(e) => {
                                if (hasOverrides) {
                                  applyQuickAssign(flight, "all", e.target.value);
                                } else {
                                  updateFlightDefault(flight, e.target.value);
                                }
                              }}
                              className="text-xs border border-navy-200 rounded-lg px-2 py-1"
                            >
                              <option value="">Select tee...</option>
                              {allTeeNames.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          ) : (
                            /* Front/back split: two dropdowns */
                            <>
                              <span className="text-xs text-navy-500">1-{halfPoint}:</span>
                              <select
                                value={config.default || ""}
                                onChange={(e) => applyQuickAssign(flight, "front-back", e.target.value, backTee)}
                                className="text-xs border border-navy-200 rounded-lg px-2 py-1"
                              >
                                <option value="">Select...</option>
                                {allTeeNames.map((t) => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                              <span className="text-xs text-navy-500">{halfPoint + 1}-{numHoles}:</span>
                              <select
                                value={backTee}
                                onChange={(e) => applyQuickAssign(flight, "front-back", config.default || allTeeNames[0], e.target.value)}
                                className="text-xs border border-navy-200 rounded-lg px-2 py-1"
                              >
                                <option value="">Select...</option>
                                {allTeeNames.map((t) => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                            </>
                          )}
                        </div>
                        {config.default && (
                          <p className="text-xs text-navy-400 mt-1.5">
                            {hasOverrides
                              ? `Default: ${config.default}, ${Object.keys(config.holes || {}).length} hole override${Object.keys(config.holes || {}).length !== 1 ? "s" : ""}`
                              : `All ${numHoles} holes: ${config.default}`}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-navy-100 text-navy-600">
                      <th className="text-left px-4 py-2">Hole</th>
                      <th className="text-left px-4 py-2">Tee Boxes</th>
                      {allTeeNames.length > 1 && flights.map((f) => (
                        <th key={f} className="text-center px-2 py-2 text-xs">{f}</th>
                      ))}
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
                        {/* Per-hole tee assignment overrides */}
                        {allTeeNames.length > 1 && flights.map((flight) => {
                          const resolved = resolvedTee(flight, hole.holeNumber);
                          const isOverride = teeAssignments[flight]?.holes?.[String(hole.holeNumber)];
                          const available = holeTeeNames(hole.holeNumber);
                          return (
                            <td key={flight} className="px-2 py-2 text-center">
                              <select
                                value={resolved}
                                onChange={(e) => updateHoleOverride(flight, hole.holeNumber, e.target.value)}
                                className={`text-xs border rounded px-1 py-0.5 max-w-[80px] ${
                                  isOverride ? "border-gold-400 bg-gold-50" : "border-navy-200"
                                }`}
                              >
                                <option value="">—</option>
                                {available.map((t) => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                            </td>
                          );
                        })}
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
          </div>
        )}
      </div>

      {/* Scorer PIN */}
      <div>
        <h2 className="text-lg font-bold text-navy-900 mb-4">Scorer PIN</h2>
        <div className="bg-white rounded-xl border border-navy-100 p-5 space-y-4">
          <div>
            <p className="text-sm text-navy-600 mb-2">
              One universal PIN for all scorers. Players go to <span className="font-mono text-navy-900">/scoring</span>, pick their team, and enter this PIN.
            </p>
            <div className="flex gap-3 items-end">
              <div className="w-40">
                <label className="block text-xs font-medium text-navy-600 mb-1">PIN (4-6 digits)</label>
                <input
                  type="text"
                  value={scorerPin}
                  onChange={(e) => setScorerPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="e.g. 1234"
                  className="w-full border border-navy-200 rounded-lg px-3 py-2 text-sm tracking-[0.3em] text-center font-mono"
                />
              </div>
              <button
                onClick={() => saveScorerPin(scorerPin)}
                disabled={scorerPin.length < 4}
                className="bg-gold-400 hover:bg-gold-300 text-navy-950 font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Scorers */}
      <div>
        <h2 className="text-lg font-bold text-navy-900 mb-4">Active Scorers</h2>
        {teamScorers.filter((t) => t.activeScorerName).length === 0 ? (
          <p className="text-navy-400 text-sm">No teams are currently being scored.</p>
        ) : (
          <div className="bg-white rounded-xl border border-navy-100 divide-y divide-navy-50">
            {teamScorers
              .filter((t) => t.activeScorerName)
              .map((team) => (
                <div key={team.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-navy-900">{team.name}</p>
                    <p className="text-xs text-navy-500">Scorer: {team.activeScorerName}</p>
                  </div>
                  <button
                    onClick={() => unlockTeamScorer(team.id)}
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    Unlock
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
