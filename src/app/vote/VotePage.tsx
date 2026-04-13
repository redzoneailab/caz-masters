"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface PollOption {
  id: string;
  label: string;
  teamId: string | null;
  playerId: string | null;
  voteCount: number;
}

interface Poll {
  id: string;
  title: string;
  type: string;
  showResultsBeforeClose: boolean;
  finalized: boolean;
  options: PollOption[];
  totalVotes: number;
  userVotedOptionId: string | null;
}

export default function VotePage() {
  const { data: session, status } = useSession();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [userTeamId, setUserTeamId] = useState<string | null>(null);
  const [userPlayerId, setUserPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchPolls = useCallback(async () => {
    try {
      const res = await fetch("/api/polls");
      const data = await res.json();
      setPolls(data.polls || []);
      setUserTeamId(data.userTeamId || null);
      setUserPlayerId(data.userPlayerId || null);
    } catch {
      setError("Failed to load polls");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status !== "loading") fetchPolls();
  }, [status, fetchPolls]);

  async function handleVote(pollId: string, optionId: string) {
    setVoting(pollId);
    setError("");
    try {
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Vote failed");
        setVoting(null);
        return;
      }
      await fetchPolls();
    } catch {
      setError("Something went wrong");
    } finally {
      setVoting(null);
    }
  }

  function isSelfOption(poll: Poll, option: PollOption) {
    if (poll.type === "team" && option.teamId && option.teamId === userTeamId) return true;
    if (poll.type === "individual" && option.playerId && option.playerId === userPlayerId) return true;
    return false;
  }

  return (
    <>
      <section className="bg-navy-950 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl font-black uppercase tracking-tight">Vote</h1>
          <p className="mt-3 text-navy-300 max-w-2xl mx-auto">
            Cast your votes for the fan-favorite awards.
          </p>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {loading ? (
            <p className="text-center text-navy-400 py-12">Loading polls...</p>
          ) : !session ? (
            <div className="text-center py-12">
              <p className="text-navy-600 mb-4">Sign in to vote.</p>
              <Link
                href="/auth/signin?callbackUrl=/vote"
                className="inline-block bg-gold-400 hover:bg-gold-300 text-navy-950 font-black px-8 py-3 rounded-xl transition-colors uppercase tracking-wider"
              >
                Sign In
              </Link>
            </div>
          ) : polls.length === 0 ? (
            <p className="text-center text-navy-400 py-12">
              No active polls right now. Check back later.
            </p>
          ) : (
            <div className="space-y-8">
              {error && (
                <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm font-medium">
                  {error}
                </div>
              )}

              {polls.map((poll) => {
                const hasVoted = !!poll.userVotedOptionId;
                const showResults = hasVoted || poll.showResultsBeforeClose;
                const maxVotes = Math.max(...poll.options.map((o) => o.voteCount), 1);

                return (
                  <div key={poll.id} className="bg-white rounded-2xl border-2 border-navy-100 overflow-hidden">
                    <div className="bg-navy-950 px-6 py-4">
                      <h2 className="text-white font-black text-xl uppercase">{poll.title}</h2>
                      <p className="text-navy-400 text-sm mt-1">
                        {poll.type === "team" ? "Team award" : "Individual award"} &middot; {poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""}
                      </p>
                    </div>

                    <div className="p-6 space-y-3">
                      {poll.options.map((option) => {
                        const isVoted = poll.userVotedOptionId === option.id;
                        const isSelf = isSelfOption(poll, option);
                        const pct = poll.totalVotes > 0 ? Math.round((option.voteCount / poll.totalVotes) * 100) : 0;
                        const isLeading = option.voteCount === maxVotes && option.voteCount > 0;

                        if (hasVoted || poll.finalized) {
                          // Show results
                          return (
                            <div key={option.id} className={`rounded-xl p-4 border-2 ${isVoted ? "border-gold-400 bg-gold-50" : "border-navy-100 bg-navy-50/50"}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`font-bold ${isLeading ? "text-gold-600" : "text-navy-800"}`}>
                                  {isLeading && showResults ? "\u2B50 " : ""}{option.label}
                                  {isVoted && <span className="text-gold-500 text-sm ml-2">Your vote</span>}
                                </span>
                                {showResults && (
                                  <span className="text-sm font-bold text-navy-600">
                                    {option.voteCount} ({pct}%)
                                  </span>
                                )}
                              </div>
                              {showResults && (
                                <div className="w-full bg-navy-200 rounded-full h-2.5">
                                  <div
                                    className={`h-2.5 rounded-full transition-all ${isLeading ? "bg-gold-400" : "bg-navy-400"}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        }

                        // Vote buttons
                        return (
                          <button
                            key={option.id}
                            onClick={() => handleVote(poll.id, option.id)}
                            disabled={voting === poll.id || isSelf}
                            className={`w-full text-left rounded-xl p-4 border-2 transition-all ${
                              isSelf
                                ? "border-navy-100 bg-navy-50 text-navy-300 cursor-not-allowed"
                                : "border-navy-200 hover:border-gold-400 hover:bg-gold-50 active:scale-[0.98]"
                            }`}
                          >
                            <span className="font-bold text-navy-800">{option.label}</span>
                            {isSelf && <span className="text-xs text-navy-400 ml-2">(your {poll.type === "team" ? "team" : "self"})</span>}
                          </button>
                        );
                      })}

                      {hasVoted && (
                        <p className="text-center text-sm text-navy-400 pt-2">
                          Thanks for voting!
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
