"use client";

import { useState, useEffect, useCallback } from "react";

interface PollOption {
  id: string;
  label: string;
  teamId: string | null;
  playerId: string | null;
  _count: { votes: number };
}

interface Poll {
  id: string;
  title: string;
  type: string;
  active: boolean;
  finalized: boolean;
  showResultsBeforeClose: boolean;
  options: PollOption[];
  createdAt: string;
}

export default function AdminPolls({ password }: { password: string }) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [type, setType] = useState("team");
  const [autoPopulate, setAutoPopulate] = useState(true);
  const [customOptions, setCustomOptions] = useState<string[]>([""]);
  const [creating, setCreating] = useState(false);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${password}`,
  };

  const fetchPolls = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/polls", {
        headers: { Authorization: `Bearer ${password}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPolls(data.polls);
    } catch {
      setError("Failed to load polls");
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => { fetchPolls(); }, [fetchPolls]);

  async function createPoll(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/admin/polls", {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: title.trim(),
          type,
          autoPopulate,
          options: customOptions.filter((o) => o.trim()),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create poll");
        return;
      }
      setTitle("");
      setCustomOptions([""]);
      await fetchPolls();
    } catch {
      setError("Failed to create poll");
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(pollId: string, active: boolean) {
    try {
      await fetch(`/api/admin/polls/${pollId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ active }),
      });
      await fetchPolls();
    } catch {
      setError("Failed to update poll");
    }
  }

  async function toggleShowResults(pollId: string, showResultsBeforeClose: boolean) {
    try {
      await fetch(`/api/admin/polls/${pollId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ showResultsBeforeClose }),
      });
      await fetchPolls();
    } catch {
      setError("Failed to update poll");
    }
  }

  async function deletePoll(pollId: string) {
    if (!confirm("Delete this poll and all its votes?")) return;
    try {
      await fetch(`/api/admin/polls/${pollId}`, {
        method: "DELETE",
        headers,
      });
      await fetchPolls();
    } catch {
      setError("Failed to delete poll");
    }
  }

  async function declareWinner(pollId: string, optionId: string) {
    if (!confirm("Declare this winner? This will close the poll and add it to the Hall of Fame.")) return;
    try {
      const res = await fetch(`/api/admin/polls/${pollId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ winnerOptionId: optionId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to declare winner");
        return;
      }
      await fetchPolls();
    } catch {
      setError("Failed to declare winner");
    }
  }

  if (loading) return <p className="text-navy-500 py-8 text-center">Loading polls...</p>;

  const activeCount = polls.filter((p) => p.active).length;
  const totalVotes = polls.reduce((s, p) => s + p.options.reduce((s2, o) => s2 + o._count.votes, 0), 0);

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-navy-100">
          <p className="text-sm text-navy-500">Total Polls</p>
          <p className="text-3xl font-bold text-navy-900">{polls.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-navy-100">
          <p className="text-sm text-navy-500">Active</p>
          <p className="text-3xl font-bold text-navy-900">{activeCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-navy-100">
          <p className="text-sm text-navy-500">Total Votes</p>
          <p className="text-3xl font-bold text-navy-900">{totalVotes}</p>
        </div>
      </div>

      {/* Create Poll */}
      <div className="bg-white rounded-xl border border-navy-100 p-5">
        <h3 className="font-bold text-navy-900 mb-4">Create Poll</h3>
        <form onSubmit={createPoll} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Poll title (e.g. Best Dressed Team)"
              className="sm:col-span-2 border border-navy-200 rounded-lg px-3 py-2 text-sm"
              required
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="border border-navy-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="team">Team Award</option>
              <option value="individual">Individual Award</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-navy-700">
              <input
                type="checkbox"
                checked={autoPopulate}
                onChange={(e) => setAutoPopulate(e.target.checked)}
                className="rounded border-navy-300 text-gold-500 focus:ring-gold-400"
              />
              Auto-populate from {type === "team" ? "teams" : "players"}
            </label>
          </div>

          {/* Custom options */}
          <div>
            <p className="text-xs font-semibold text-navy-500 uppercase tracking-wider mb-2">
              Custom Options (optional)
            </p>
            {customOptions.map((opt, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...customOptions];
                    newOpts[i] = e.target.value;
                    setCustomOptions(newOpts);
                  }}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 border border-navy-200 rounded-lg px-3 py-2 text-sm"
                />
                {customOptions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setCustomOptions(customOptions.filter((_, j) => j !== i))}
                    className="text-red-500 hover:text-red-700 px-2 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setCustomOptions([...customOptions, ""])}
              className="text-sm text-navy-500 hover:text-navy-700"
            >
              + Add Option
            </button>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="bg-gold-400 hover:bg-gold-300 text-navy-950 font-bold px-6 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create Poll"}
          </button>
        </form>
      </div>

      {/* Existing Polls */}
      {polls.map((poll) => {
        const isExpanded = expanded === poll.id;
        const pollVotes = poll.options.reduce((s, o) => s + o._count.votes, 0);
        const sortedOptions = [...poll.options].sort((a, b) => b._count.votes - a._count.votes);
        const maxVotes = sortedOptions[0]?._count.votes || 0;

        return (
          <div key={poll.id} className="bg-white rounded-xl border border-navy-100 overflow-hidden">
            <button
              onClick={() => setExpanded(isExpanded ? null : poll.id)}
              className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-navy-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-navy-900">{poll.title}</h3>
                {poll.finalized ? (
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-gold-100 text-gold-700">Finalized</span>
                ) : poll.active ? (
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-700">Active</span>
                ) : (
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-navy-100 text-navy-600">Inactive</span>
                )}
                <span className="text-xs text-navy-400">
                  {poll.type === "team" ? "Team" : "Individual"} &middot; {pollVotes} vote{pollVotes !== 1 ? "s" : ""}
                </span>
              </div>
              <svg className={`w-4 h-4 text-navy-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isExpanded && (
              <div className="px-5 pb-5 border-t border-navy-100 pt-4">
                {/* Controls */}
                {!poll.finalized && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      onClick={() => toggleActive(poll.id, !poll.active)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        poll.active
                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      {poll.active ? "Close Poll" : "Open Poll"}
                    </button>
                    <button
                      onClick={() => toggleShowResults(poll.id, !poll.showResultsBeforeClose)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-navy-100 text-navy-600 hover:bg-navy-200 transition-colors"
                    >
                      {poll.showResultsBeforeClose ? "Hide Results Until Close" : "Show Live Results"}
                    </button>
                    <button
                      onClick={() => deletePoll(poll.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Delete Poll
                    </button>
                  </div>
                )}

                {/* Results */}
                <div className="space-y-2">
                  {sortedOptions.map((option) => {
                    const pct = pollVotes > 0 ? Math.round((option._count.votes / pollVotes) * 100) : 0;
                    const isLeading = option._count.votes === maxVotes && maxVotes > 0;

                    return (
                      <div key={option.id} className={`rounded-lg p-3 border ${isLeading ? "border-gold-300 bg-gold-50" : "border-navy-100"}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-semibold text-sm ${isLeading ? "text-gold-700" : "text-navy-800"}`}>
                            {isLeading ? "\u2B50 " : ""}{option.label}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-navy-600">
                              {option._count.votes} ({pct}%)
                            </span>
                            {!poll.finalized && option._count.votes > 0 && (
                              <button
                                onClick={() => declareWinner(poll.id, option.id)}
                                className="text-xs bg-gold-400 hover:bg-gold-300 text-navy-950 font-bold px-3 py-1 rounded-lg transition-colors"
                              >
                                Declare Winner
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-navy-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${isLeading ? "bg-gold-400" : "bg-navy-400"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {polls.length === 0 && (
        <p className="text-navy-400 text-sm text-center py-8">
          No polls yet. Create one above.
        </p>
      )}
    </div>
  );
}
