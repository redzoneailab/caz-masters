"use client";

import { useState, useEffect, useCallback } from "react";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    } catch {
      setError("Failed to load teams");
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

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
          <button onClick={fetchTeams} className="bg-white border border-navy-200 text-navy-600 px-4 py-2 rounded-lg text-sm hover:bg-navy-50">
            Refresh
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

      {/* Teams */}
      <div className="space-y-4">
        {teams.map((team) => (
          <div key={team.id} className="bg-white rounded-xl border border-navy-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-navy-900">{team.name}</h3>
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
                <select
                  value={team.startingHole ?? ""}
                  onChange={(e) => updateStartingHole(team.id, e.target.value ? parseInt(e.target.value) : null)}
                  className="text-xs border border-navy-200 rounded px-2 py-1"
                >
                  <option value="">Start hole...</option>
                  {Array.from({ length: 18 }, (_, i) => i + 1).map((h) => (
                    <option key={h} value={h}>Hole {h}</option>
                  ))}
                </select>
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
