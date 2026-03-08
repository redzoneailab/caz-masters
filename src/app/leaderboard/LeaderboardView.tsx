"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface TeeBoxInfo { name: string; par: number; yardage: number | null }
interface HoleInfo { holeNumber: number; teeBoxes: TeeBoxInfo[] }
interface ScoreByHole { [hole: number]: { strokes: number; par: number; shotgunBeer: boolean; rehit: boolean } }

interface IndividualEntry {
  playerId: string;
  name: string;
  flight: string;
  teamName: string;
  totalStrokes: number;
  toPar: number;
  holesCompleted: number;
  thru: number;
  finished: boolean;
  currentHole: number | null;
  beerCount: number;
  scoresByHole: ScoreByHole;
}

interface TeamMemberScore {
  holeNumber: number;
  strokes: number;
  stableford: number;
}

interface TeamEntry {
  teamId: string;
  name: string;
  totalPoints: number;
  holesCompleted: number;
  thru: number;
  finished: boolean;
  currentHole: number | null;
  members: { id: string; name: string; scores: TeamMemberScore[] }[];
}

interface BeerEntry {
  playerId: string;
  name: string;
  teamName: string;
  beerCount: number;
  totalOwed: number;
}

type Tab = "mens" | "womens" | "team" | "beers";

export default function LeaderboardView() {
  const [tab, setTab] = useState<Tab>("mens");
  const [mens, setMens] = useState<IndividualEntry[]>([]);
  const [womens, setWomens] = useState<IndividualEntry[]>([]);
  const [teamStableford, setTeamStableford] = useState<TeamEntry[]>([]);
  const [shotgunChampion, setShotgunChampion] = useState<BeerEntry[]>([]);
  const [holes, setHoles] = useState<HoleInfo[]>([]);
  const [numHoles, setNumHoles] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<string>("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/leaderboard");
      if (!res.ok) return;
      const data = await res.json();
      setMens(data.mens);
      setWomens(data.womens);
      setTeamStableford(data.teamStableford);
      setShotgunChampion(data.shotgunChampion);
      setHoles(data.holes);
      setNumHoles(data.numHoles || 0);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch { /* offline */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  function formatToPar(toPar: number) {
    if (toPar < 0) return toPar.toString();
    if (toPar === 0) return "E";
    return `+${toPar}`;
  }

  function toParColor(toPar: number) {
    if (toPar < 0) return "text-red-400";
    if (toPar === 0) return "text-white";
    return "text-navy-300";
  }

  function thruLabel(thru: number, finished: boolean) {
    return finished ? "F" : `${thru}`;
  }

  function renderScorecard(entry: IndividualEntry) {
    const totalPlayerPar = holes.reduce((sum, h) => {
      const s = entry.scoresByHole[h.holeNumber];
      return sum + (s?.par ?? 0);
    }, 0);

    return (
      <div className="bg-navy-800 rounded-lg p-3 mt-2 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-navy-400">
              <th className="text-left px-1.5 py-1">Hole</th>
              {holes.map((h) => (
                <th key={h.holeNumber} className="px-1.5 py-1 text-center w-8">{h.holeNumber}</th>
              ))}
              <th className="px-1.5 py-1 text-center font-bold">Tot</th>
            </tr>
            <tr className="text-navy-500">
              <td className="px-1.5 py-0.5">Par</td>
              {holes.map((h) => {
                const s = entry.scoresByHole[h.holeNumber];
                return (
                  <td key={h.holeNumber} className="px-1.5 py-0.5 text-center">{s?.par ?? "-"}</td>
                );
              })}
              <td className="px-1.5 py-0.5 text-center">{totalPlayerPar || "-"}</td>
            </tr>
          </thead>
          <tbody>
            <tr className="text-white font-medium">
              <td className="px-1.5 py-1">Score</td>
              {holes.map((h) => {
                const s = entry.scoresByHole[h.holeNumber];
                if (!s) return <td key={h.holeNumber} className="px-1.5 py-1 text-center text-navy-600">-</td>;
                const diff = s.strokes - s.par;
                const bg = diff <= -2 ? "bg-gold-400 text-navy-950 rounded" : diff === -1 ? "bg-red-500/30 text-red-300 rounded" : diff >= 2 ? "bg-navy-700 text-navy-400 rounded" : "";
                return (
                  <td key={h.holeNumber} className="px-1.5 py-1 text-center">
                    <span className={`inline-block w-6 h-6 leading-6 text-center ${bg}`}>{s.strokes}</span>
                  </td>
                );
              })}
              <td className="px-1.5 py-1 text-center font-bold">{entry.totalStrokes}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  function renderTeamScorecard(team: TeamEntry) {
    return (
      <div className="bg-navy-800 rounded-lg p-3 mt-2 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-navy-400">
              <th className="text-left px-1.5 py-1">Player</th>
              {holes.map((h) => (
                <th key={h.holeNumber} className="px-1.5 py-1 text-center w-8">{h.holeNumber}</th>
              ))}
              <th className="px-1.5 py-1 text-center">Pts</th>
            </tr>
          </thead>
          <tbody>
            {team.members.map((member) => {
              const byHole = new Map(member.scores.map((s) => [s.holeNumber, s]));
              const totalPts = member.scores.reduce((sum, s) => sum + s.stableford, 0);
              return (
                <tr key={member.id} className="text-white">
                  <td className="px-1.5 py-1 font-medium truncate max-w-[80px]">{member.name.split(" ")[0]}</td>
                  {holes.map((h) => {
                    const s = byHole.get(h.holeNumber);
                    if (!s) return <td key={h.holeNumber} className="text-center text-navy-600">-</td>;
                    return (
                      <td key={h.holeNumber} className="text-center">
                        <span className="text-navy-400">{s.strokes}</span>
                        <span className="text-gold-400 text-[10px] ml-0.5">{s.stableford}</span>
                      </td>
                    );
                  })}
                  <td className="text-center font-bold text-gold-400">{totalPts}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "mens", label: "Men's" },
    { id: "womens", label: "Women's" },
    { id: "team", label: "Teams" },
    { id: "beers", label: "Shotgun" },
  ];

  return (
    <section className="min-h-screen bg-navy-950">
      {/* Header */}
      <div className="bg-navy-900 border-b border-navy-800 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-white uppercase">Live Leaderboard</h1>
              <p className="text-navy-400 text-xs mt-0.5">
                {lastRefresh ? `Updated ${lastRefresh}` : "Loading..."} &middot; Auto-refreshes every 30s
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchData}
                className="bg-navy-800 hover:bg-navy-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
              >
                Refresh
              </button>
              <Link
                href="/scoring"
                className="bg-gold-400 hover:bg-gold-300 text-navy-950 font-bold px-3 py-2 rounded-lg text-sm transition-colors"
              >
                Enter Scores
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setExpanded(null); }}
                className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-colors ${
                  tab === t.id
                    ? "bg-gold-400 text-navy-950"
                    : "bg-navy-800 text-navy-400 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {loading ? (
          <p className="text-navy-400 text-center py-12">Loading leaderboard...</p>
        ) : (
          <>
            {/* Individual leaderboard */}
            {(tab === "mens" || tab === "womens") && (
              <div className="space-y-1">
                {/* Column headers */}
                {(tab === "mens" ? mens : womens).length > 0 && (
                  <div className="flex items-center gap-3 px-4 py-1 text-navy-500 text-xs">
                    <span className="w-8 shrink-0">#</span>
                    <span className="flex-1">Player</span>
                    <span className="w-12 text-center shrink-0">Thru</span>
                    <span className="w-16 text-right shrink-0">Score</span>
                  </div>
                )}
                {(tab === "mens" ? mens : womens).length === 0 ? (
                  <p className="text-navy-500 text-center py-12">No scores yet.</p>
                ) : (
                  (tab === "mens" ? mens : womens).map((entry, i) => (
                    <div key={entry.playerId}>
                      <button
                        onClick={() => setExpanded(expanded === entry.playerId ? null : entry.playerId)}
                        className="w-full flex items-center gap-3 bg-navy-900 hover:bg-navy-800 rounded-xl px-4 py-3 transition-colors text-left"
                      >
                        <span className="text-navy-500 font-bold text-lg w-8 shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-lg truncate">{entry.name}</p>
                          <p className="text-navy-500 text-xs">{entry.teamName}</p>
                        </div>
                        <div className="w-12 text-center shrink-0">
                          <span className={`text-sm font-semibold ${entry.finished ? "text-white" : "text-navy-400"}`}>
                            {thruLabel(entry.thru, entry.finished)}
                          </span>
                        </div>
                        <div className="w-16 text-right shrink-0">
                          <p className={`font-black text-2xl ${toParColor(entry.toPar)}`}>
                            {formatToPar(entry.toPar)}{!entry.finished && "*"}
                          </p>
                          <p className="text-navy-500 text-xs">{entry.totalStrokes}</p>
                        </div>
                      </button>
                      {expanded === entry.playerId && renderScorecard(entry)}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Team Stableford */}
            {tab === "team" && (
              <div className="space-y-1">
                <div className="flex items-center justify-between px-2 py-2 text-navy-400 text-xs">
                  <span>Eagle=4 &middot; Birdie=3 &middot; Par=2 &middot; Bogey=1 &middot; Double+=0</span>
                </div>
                {teamStableford.length === 0 ? (
                  <p className="text-navy-500 text-center py-12">No team scores yet.</p>
                ) : (
                  teamStableford.map((team, i) => (
                    <div key={team.teamId}>
                      <button
                        onClick={() => setExpanded(expanded === team.teamId ? null : team.teamId)}
                        className="w-full flex items-center gap-3 bg-navy-900 hover:bg-navy-800 rounded-xl px-4 py-3 transition-colors text-left"
                      >
                        <span className="text-navy-500 font-bold text-lg w-8 shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-lg truncate">{team.name}</p>
                          <p className="text-navy-500 text-xs">
                            {team.members.length} players
                          </p>
                        </div>
                        <div className="w-12 text-center shrink-0">
                          <span className={`text-sm font-semibold ${team.finished ? "text-white" : "text-navy-400"}`}>
                            {thruLabel(team.thru, team.finished)}
                          </span>
                        </div>
                        <div className="w-16 text-right shrink-0">
                          <p className="font-black text-2xl text-gold-400">
                            {team.totalPoints}{!team.finished && "*"}
                          </p>
                          <p className="text-navy-500 text-xs">points</p>
                        </div>
                      </button>
                      {expanded === team.teamId && renderTeamScorecard(team)}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Shotgun Champion */}
            {tab === "beers" && (
              <div className="space-y-1">
                {shotgunChampion.length === 0 ? (
                  <p className="text-navy-500 text-center py-12">No shotguns yet. Who&apos;s first?</p>
                ) : (
                  shotgunChampion.map((entry, i) => (
                    <div
                      key={entry.playerId}
                      className="flex items-center gap-3 bg-navy-900 rounded-xl px-4 py-3"
                    >
                      <span className="text-navy-500 font-bold text-lg w-8 shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-lg truncate">{entry.name}</p>
                        <p className="text-navy-500 text-xs">{entry.teamName}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-2xl text-gold-400">{entry.beerCount}</p>
                        <p className="text-navy-500 text-xs">${entry.totalOwed} tab</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
