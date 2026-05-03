"use client";

import { useState, useEffect, useCallback } from "react";
import { downloadCSV } from "@/lib/csv";

interface TeamMember {
  id: string;
  fullName: string;
  genderFlight: string;
  email: string;
}

interface Team {
  id: string;
  name: string;
  locked: boolean;
  maxSize: number;
  startingHole: number | null;
  members: TeamMember[];
}

export default function AdminTeams({ password }: { password: string }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [freeAgents, setFreeAgents] = useState<TeamMember[]>([]);
  const [teamsLocked, setTeamsLocked] = useState(false);
  const [shotgunStart, setShotgunStart] = useState(true);
  const [numHoles, setNumHoles] = useState(18);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamMaxSize, setNewTeamMaxSize] = useState(4);
  const [creating, setCreating] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${password}`,
  };

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/teams", {
        headers: { Authorization: `Bearer ${password}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTeams(data.teams);
      setFreeAgents(data.freeAgents);
      setTeamsLocked(data.teamsLocked);
      setShotgunStart(data.shotgunStart ?? true);
      setNumHoles(data.numHoles ?? 18);
    } catch {
      setError("Failed to load teams");
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  // Build hole assignment map for shotgun grid
  const holeAssignments = new Map<number, Team[]>();
  for (let h = 1; h <= numHoles; h++) holeAssignments.set(h, []);
  for (const team of teams) {
    if (team.startingHole) {
      const arr = holeAssignments.get(team.startingHole) || [];
      arr.push(team);
      holeAssignments.set(team.startingHole, arr);
    }
  }

  const unassignedTeams = teams.filter((t) => !t.startingHole);

  function getHoleStatus(hole: number): "empty" | "single" | "full" {
    const count = holeAssignments.get(hole)?.length || 0;
    if (count === 0) return "empty";
    if (count === 1) return "single";
    return "full";
  }

  async function toggleTeamsLocked() {
    try {
      await fetch("/api/admin/teams", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ teamsLocked: !teamsLocked }),
      });
      setTeamsLocked(!teamsLocked);
    } catch {
      setError("Failed to update");
    }
  }

  async function toggleLockTeam(teamId: string, locked: boolean) {
    try {
      await fetch(`/api/admin/teams/${teamId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ locked }),
      });
      await fetchTeams();
    } catch {
      setError("Failed to update team");
    }
  }

  async function updateMaxSize(teamId: string, maxSize: number) {
    try {
      await fetch(`/api/admin/teams/${teamId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ maxSize }),
      });
      await fetchTeams();
    } catch {
      setError("Failed to update team");
    }
  }

  async function updateStartingHole(teamId: string, startingHole: number | null) {
    try {
      await fetch(`/api/admin/teams/${teamId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ startingHole }),
      });
      await fetchTeams();
    } catch {
      setError("Failed to update starting hole");
    }
  }

  async function movePlayer(playerId: string, targetTeamId: string) {
    try {
      await fetch(`/api/admin/teams/${targetTeamId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ movePlayerId: playerId }),
      });
      await fetchTeams();
    } catch {
      setError("Failed to move player");
    }
  }

  async function createTeam(e: React.FormEvent) {
    e.preventDefault();
    const name = newTeamName.trim();
    if (!name) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/admin/teams", {
        method: "POST",
        headers,
        body: JSON.stringify({ name, maxSize: newTeamMaxSize }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create team");
      }
      setNewTeamName("");
      setNewTeamMaxSize(4);
      setShowCreate(false);
      await fetchTeams();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create team");
    } finally {
      setCreating(false);
    }
  }

  async function renameTeam(teamId: string) {
    const name = renameValue.trim();
    if (!name) {
      setRenamingId(null);
      return;
    }
    setError("");
    try {
      const res = await fetch(`/api/admin/teams/${teamId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to rename team");
      }
      setRenamingId(null);
      setRenameValue("");
      await fetchTeams();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename team");
    }
  }

  async function deleteTeam(teamId: string) {
    if (!confirm("Delete this team? Members will become free agents.")) return;
    try {
      await fetch(`/api/admin/teams/${teamId}`, {
        method: "DELETE",
        headers,
      });
      await fetchTeams();
    } catch {
      setError("Failed to delete team");
    }
  }

  if (loading) return <p className="text-navy-500 py-8 text-center">Loading teams...</p>;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-navy-900">
          Teams ({teams.length})
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowCreate((v) => !v);
              setNewTeamName("");
              setNewTeamMaxSize(4);
            }}
            className="bg-navy-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-navy-800"
          >
            {showCreate ? "Cancel" : "+ Create Team"}
          </button>
          <button onClick={fetchTeams} className="bg-white border border-navy-200 text-navy-600 px-4 py-2 rounded-lg text-sm hover:bg-navy-50">
            Refresh
          </button>
          <button
            onClick={() => {
              const maxMembers = Math.max(...teams.map((t) => t.members.length), 4);
              const headers = ["Team Name", "Starting Hole"];
              for (let i = 1; i <= maxMembers; i++) headers.push(`Player ${i}`);
              const rows = teams.map((t) => {
                const row = [t.name, t.startingHole ? String(t.startingHole) : ""];
                for (let i = 0; i < maxMembers; i++) {
                  row.push(t.members[i]?.fullName || "");
                }
                return row;
              });
              downloadCSV(`caz-masters-team-sheet-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
            }}
            className="bg-white border border-navy-200 text-navy-600 px-4 py-2 rounded-lg text-sm hover:bg-navy-50"
          >
            Download Team Sheet
          </button>
          <button
            onClick={toggleTeamsLocked}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              teamsLocked
                ? "bg-navy-100 text-navy-600 hover:bg-navy-200"
                : "bg-red-100 text-red-700 hover:bg-red-200"
            }`}
          >
            {teamsLocked ? "Unlock All Teams" : "Lock All Teams"}
          </button>
        </div>
      </div>

      {showCreate && (
        <form
          onSubmit={createTeam}
          className="bg-white rounded-xl border border-navy-200 p-4 flex flex-wrap items-end gap-3"
        >
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-navy-700 mb-1">Team name</label>
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="e.g. The Birdie Hunters"
              autoFocus
              className="w-full border border-navy-200 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-navy-700 mb-1">Max size</label>
            <select
              value={newTeamMaxSize}
              onChange={(e) => setNewTeamMaxSize(parseInt(e.target.value))}
              className="border border-navy-200 rounded px-2 py-2 text-sm"
            >
              <option value={4}>4 players</option>
              <option value={5}>5 players</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={creating || !newTeamName.trim()}
            className="bg-gold-500 text-navy-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? "Creating..." : "Create Team"}
          </button>
        </form>
      )}

      {/* Shotgun Start Assignment Grid */}
      {shotgunStart && (
        <div>
          <h3 className="font-bold text-navy-900 mb-3">Shotgun Start Layout</h3>
          {unassignedTeams.length > 0 && (
            <div className="bg-amber-50 text-amber-800 border border-amber-200 rounded-lg px-4 py-2.5 text-sm mb-3">
              {unassignedTeams.length} team{unassignedTeams.length !== 1 ? "s" : ""} without a starting hole:{" "}
              {unassignedTeams.map((t) => t.name).join(", ")}
            </div>
          )}
          <div className="bg-white rounded-xl border border-navy-100 overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-px bg-navy-100">
              {Array.from({ length: numHoles }, (_, i) => i + 1).map((hole) => {
                const assigned = holeAssignments.get(hole) || [];
                const status = getHoleStatus(hole);
                return (
                  <div
                    key={hole}
                    className={`bg-white p-3 min-h-[80px] ${
                      status === "full" ? "ring-1 ring-inset ring-gold-400" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-navy-900">Hole {hole}</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          status === "full"
                            ? "bg-gold-400"
                            : status === "single"
                            ? "bg-green-400"
                            : "bg-navy-200"
                        }`}
                      />
                    </div>
                    {assigned.length > 0 ? (
                      <div className="space-y-1">
                        {assigned.map((t) => (
                          <p key={t.id} className="text-xs text-navy-700 truncate">{t.name}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-navy-300 italic">Open</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-navy-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-navy-200" /> Open</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" /> 1 team</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gold-400" /> 2 teams (max)</span>
          </div>
        </div>
      )}

      {/* Teams */}
      <div className="space-y-4">
        {teams.map((team) => (
          <div key={team.id} className="bg-white rounded-xl border border-navy-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {renamingId === team.id ? (
                  <form
                    onSubmit={(e) => { e.preventDefault(); renameTeam(team.id); }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setRenamingId(null);
                          setRenameValue("");
                        }
                      }}
                      className="text-sm font-bold border border-navy-200 rounded px-2 py-1"
                    />
                    <button
                      type="submit"
                      className="text-xs bg-navy-900 text-white px-2 py-1 rounded hover:bg-navy-800"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => { setRenamingId(null); setRenameValue(""); }}
                      className="text-xs text-navy-500 hover:text-navy-700"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <h3 className="font-bold text-navy-900">{team.name}</h3>
                    <button
                      onClick={() => { setRenamingId(team.id); setRenameValue(team.name); }}
                      className="text-xs text-navy-400 hover:text-navy-700"
                      title="Rename team"
                    >
                      Rename
                    </button>
                  </>
                )}
                <span className="text-xs text-navy-400">
                  {team.members.length}/{team.maxSize}
                </span>
                {team.locked && (
                  <span className="text-xs bg-gold-100 text-gold-600 px-2 py-0.5 rounded-full font-medium">
                    Locked
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <select
                  value={team.maxSize}
                  onChange={(e) => updateMaxSize(team.id, parseInt(e.target.value))}
                  className="text-xs border border-navy-200 rounded px-2 py-1"
                >
                  <option value={4}>Max 4</option>
                  <option value={5}>Max 5</option>
                </select>
                {shotgunStart && (
                  <select
                    value={team.startingHole ?? ""}
                    onChange={(e) => updateStartingHole(team.id, e.target.value ? parseInt(e.target.value) : null)}
                    className="text-xs border border-navy-200 rounded px-2 py-1"
                  >
                    <option value="">Start hole...</option>
                    {Array.from({ length: numHoles }, (_, i) => i + 1).map((h) => {
                      const count = holeAssignments.get(h)?.length || 0;
                      // If this team is already on this hole, don't count it toward the limit
                      const otherCount = team.startingHole === h ? count - 1 : count;
                      const full = otherCount >= 2;
                      return (
                        <option key={h} value={h} disabled={full}>
                          Hole {h}{full ? " (full)" : otherCount === 1 ? " (1 team)" : ""}
                        </option>
                      );
                    })}
                  </select>
                )}
                <button
                  onClick={() => toggleLockTeam(team.id, !team.locked)}
                  className="text-xs bg-navy-50 text-navy-600 hover:bg-navy-100 px-3 py-1 rounded transition-colors"
                >
                  {team.locked ? "Unlock" : "Lock"}
                </button>
                <button
                  onClick={() => deleteTeam(team.id)}
                  className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1 rounded transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="space-y-1">
              {team.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between text-sm py-1">
                  <span className="text-navy-700">
                    {member.fullName} <span className="text-navy-400">({member.genderFlight})</span>
                  </span>
                  <button
                    onClick={() => movePlayer(member.id, "free-agents")}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            {/* Add free agent dropdown */}
            {team.members.length < team.maxSize && freeAgents.length > 0 && (
              <div className="mt-3">
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) movePlayer(e.target.value, team.id);
                    e.target.value = "";
                  }}
                  className="text-xs border border-navy-200 rounded px-2 py-1.5 w-full"
                >
                  <option value="">+ Add a player...</option>
                  {freeAgents.map((fa) => (
                    <option key={fa.id} value={fa.id}>
                      {fa.fullName} ({fa.genderFlight})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Free Agents */}
      <div>
        <h3 className="font-bold text-navy-900 mb-3">Free Agents ({freeAgents.length})</h3>
        {freeAgents.length === 0 ? (
          <p className="text-navy-400 text-sm">All players assigned to teams.</p>
        ) : (
          <div className="bg-white rounded-xl border border-navy-100 divide-y divide-navy-50">
            {freeAgents.map((player) => (
              <div key={player.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-navy-700">
                  {player.fullName} <span className="text-navy-400">({player.genderFlight})</span>
                </span>
                {teams.length > 0 && (
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) movePlayer(player.id, e.target.value);
                      e.target.value = "";
                    }}
                    className="text-xs border border-navy-200 rounded px-2 py-1"
                  >
                    <option value="">Move to team...</option>
                    {teams
                      .filter((t) => t.members.length < t.maxSize)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.members.length}/{t.maxSize})
                        </option>
                      ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
