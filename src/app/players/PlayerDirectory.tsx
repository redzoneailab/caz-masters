"use client";

import { useState } from "react";
import Link from "next/link";

interface DirectoryEntry {
  name: string;
  flight: string;
  profileId: string;
  years: number[];
  tournamentsPlayed: number;
  hasScores: boolean;
}

type SortKey = "name" | "tournaments" | "recent";

export default function PlayerDirectory({ players }: { players: DirectoryEntry[] }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("name");

  const filtered = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "tournaments") return b.tournamentsPlayed - a.tournamentsPlayed;
    if (sortBy === "recent") return (b.years[0] || 0) - (a.years[0] || 0);
    return a.name.localeCompare(b.name);
  });

  return (
    <section className="py-8 bg-white min-h-[60vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search players..."
            className="flex-1 border border-navy-200 rounded-lg px-4 py-2.5 text-sm focus:border-gold-400 focus:outline-none"
          />
          <div className="flex gap-1">
            {([["name", "A-Z"], ["tournaments", "Most Played"], ["recent", "Most Recent"]] as [SortKey, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  sortBy === key
                    ? "bg-navy-900 text-white"
                    : "bg-navy-50 text-navy-600 hover:bg-navy-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="text-navy-400 text-sm mb-4">{sorted.length} player{sorted.length !== 1 ? "s" : ""}</p>

        {/* Player list */}
        <div className="bg-white rounded-xl border border-navy-100 divide-y divide-navy-50">
          {sorted.map((player) => (
            <Link
              key={player.profileId}
              href={`/player/${player.profileId}`}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-navy-50 transition-colors"
            >
              <div>
                <p className="font-semibold text-navy-900">{player.name}</p>
                <p className="text-xs text-navy-500">
                  {player.flight} &middot; {player.tournamentsPlayed} tournament{player.tournamentsPlayed !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="text-right">
                <div className="flex gap-1 flex-wrap justify-end">
                  {player.years.map((y) => (
                    <span key={y} className="text-xs bg-navy-100 text-navy-600 px-2 py-0.5 rounded-full">
                      {y}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
          {sorted.length === 0 && (
            <p className="text-navy-400 text-center py-12">No players found.</p>
          )}
        </div>
      </div>
    </section>
  );
}
