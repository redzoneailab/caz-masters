"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface TeamMember {
  id: string;
  fullName: string;
  genderFlight: string;
}

interface Team {
  id: string;
  name: string;
  locked: boolean;
  maxSize: number;
  members: TeamMember[];
}

interface Props {
  teams: Team[];
  freeAgents: TeamMember[];
  teamsLocked: boolean;
  tournamentId: string;
}

export default function TeamsBoard({ teams, freeAgents, teamsLocked, tournamentId }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function createTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim()) return;
    setLoading("create");
    setError("");
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: teamName.trim(), tournamentId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create team");
        return;
      }
      setTeamName("");
      setCreating(false);
      router.refresh();
    } catch {
      setError("Failed to create team");
    } finally {
      setLoading(null);
    }
  }

  async function joinTeam(teamId: string) {
    setLoading(teamId);
    setError("");
    try {
      const res = await fetch(`/api/teams/${teamId}/join`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to join team");
        return;
      }
      router.refresh();
    } catch {
      setError("Failed to join team");
    } finally {
      setLoading(null);
    }
  }

  async function leaveTeam(teamId: string) {
    setLoading(teamId);
    setError("");
    try {
      const res = await fetch(`/api/teams/${teamId}/leave`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to leave team");
        return;
      }
      router.refresh();
    } catch {
      setError("Failed to leave team");
    } finally {
      setLoading(null);
    }
  }

  // Check if current user is on any team
  const userAccountId = session?.userAccountId;

  return (
    <section className="py-12 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        {teamsLocked && (
          <div className="bg-gold-50 text-gold-600 border border-gold-200 rounded-lg px-4 py-3 text-sm mb-6 font-medium">
            Teams are locked. Contact an admin to make changes.
          </div>
        )}

        {/* Create team */}
        {!teamsLocked && (
          <div className="mb-8">
            {session ? (
              creating ? (
                <form onSubmit={createTeam} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-navy-700 mb-1">Team Name</label>
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Enter team name..."
                      className="w-full rounded-lg border border-navy-200 px-4 py-2.5 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-none"
                      maxLength={50}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading === "create"}
                    className="bg-gold-400 hover:bg-gold-300 text-navy-950 font-bold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading === "create" ? "Creating..." : "Create"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreating(false)}
                    className="text-navy-500 hover:text-navy-700 px-4 py-2.5"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setCreating(true)}
                  className="bg-navy-800 hover:bg-navy-900 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
                >
                  + Create a Team
                </button>
              )
            ) : (
              <Link
                href="/auth/signin"
                className="bg-navy-800 hover:bg-navy-900 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
              >
                Sign in to Create or Join a Team
              </Link>
            )}
          </div>
        )}

        {/* Teams grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {teams.map((team) => {
            const isFull = team.members.length >= team.maxSize;
            const isOnThisTeam = userAccountId && team.members.some((m) =>
              // We'll check by looking at the player list - simplified here
              false // This gets resolved by the join/leave API tracking
            );

            return (
              <div
                key={team.id}
                className={`rounded-xl border-2 p-5 ${
                  team.locked
                    ? "border-gold-300 bg-gold-50/30"
                    : "border-navy-100 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-navy-900 text-lg">{team.name}</h3>
                  <span className="text-xs text-navy-400 font-medium">
                    {team.members.length}/{team.maxSize}
                  </span>
                </div>
                {team.locked && (
                  <span className="inline-block text-xs bg-gold-100 text-gold-600 px-2 py-0.5 rounded-full font-medium mb-3">
                    Locked
                  </span>
                )}
                <ul className="space-y-1.5 mb-4">
                  {team.members.map((member) => (
                    <li key={member.id} className="text-sm text-navy-700 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-400 shrink-0" />
                      {member.fullName}
                      <span className="text-navy-400 text-xs">({member.genderFlight})</span>
                    </li>
                  ))}
                  {Array.from({ length: team.maxSize - team.members.length }).map((_, i) => (
                    <li key={`empty-${i}`} className="text-sm text-navy-300 italic flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-navy-200 shrink-0" />
                      Open spot
                    </li>
                  ))}
                </ul>
                {session && !teamsLocked && !team.locked && (
                  <div className="flex gap-2">
                    {!isFull && (
                      <button
                        onClick={() => joinTeam(team.id)}
                        disabled={loading === team.id}
                        className="text-xs bg-navy-100 text-navy-700 hover:bg-navy-200 px-3 py-1.5 rounded-lg transition-colors font-medium disabled:opacity-50"
                      >
                        Join Team
                      </button>
                    )}
                    <button
                      onClick={() => leaveTeam(team.id)}
                      disabled={loading === team.id}
                      className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors font-medium disabled:opacity-50"
                    >
                      Leave
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Free Agents */}
        <div>
          <h2 className="text-xl font-bold text-navy-900 mb-4">
            Free Agents
            <span className="text-sm font-normal text-navy-500 ml-2">({freeAgents.length} players)</span>
          </h2>
          {freeAgents.length === 0 ? (
            <p className="text-navy-400 text-sm">All registered players are on teams.</p>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {freeAgents.map((player) => (
                <div
                  key={player.id}
                  className="bg-navy-50 rounded-lg px-4 py-3 text-sm"
                >
                  <p className="font-medium text-navy-800">{player.fullName}</p>
                  <p className="text-navy-500 text-xs">{player.genderFlight}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
