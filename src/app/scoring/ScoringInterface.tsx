"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getTeeBoxName } from "@/lib/tees";

interface PlayerInfo {
  id: string;
  fullName: string;
  genderFlight: string;
}

interface TeeBoxInfo {
  name: string;
  par: number;
  yardage: number | null;
}

interface Hole {
  holeNumber: number;
  teeBoxes: TeeBoxInfo[];
}

interface ScoreEntry {
  playerId: string;
  holeNumber: number;
  strokes: number;
  shotgunBeer: boolean;
  rehit: boolean;
  synced: boolean;
}

const STORAGE_KEY = "caz-scoring-data";

export default function ScoringInterface() {
  // Auth state
  const [fullName, setFullName] = useState("");
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Scoring state
  const [scorerId, setScorerId] = useState("");
  const [scorerPin, setScorerPin] = useState("");
  const [teamName, setTeamName] = useState("");
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [holes, setHoles] = useState<Hole[]>([]);
  const [tournamentId, setTournamentId] = useState("");
  const [startingHole, setStartingHole] = useState(1);
  const [currentHole, setCurrentHole] = useState(0); // index
  const [scores, setScores] = useState<Map<string, ScoreEntry>>(new Map());
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Track online status
  useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // When coming online, sync pending scores
  useEffect(() => {
    if (online && authed) syncPendingScores();
  }, [online, authed]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load cached data from localStorage on mount
  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        if (data.scorerId && data.pin) {
          setScorerId(data.scorerId);
          setScorerPin(data.pin);
          setTeamName(data.teamName || "");
          setPlayers(data.players || []);
          setHoles(data.holes || []);
          setTournamentId(data.tournamentId || "");
          setStartingHole(data.startingHole || 1);
          setCurrentHole(data.currentHole || 0);
          const scoreMap = new Map<string, ScoreEntry>();
          for (const [key, val] of Object.entries(data.scores || {})) {
            scoreMap.set(key, val as ScoreEntry);
          }
          setScores(scoreMap);
          setAuthed(true);
        }
      } catch { /* ignore corrupt data */ }
    }
  }, []);

  // Save to localStorage on score changes
  const saveToLocal = useCallback(() => {
    if (!authed) return;
    const data = {
      scorerId,
      pin: scorerPin,
      teamName,
      players,
      holes,
      tournamentId,
      currentHole,
      startingHole,
      scores: Object.fromEntries(scores),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [authed, scorerId, scorerPin, teamName, players, holes, tournamentId, currentHole, startingHole, scores]);

  useEffect(() => { saveToLocal(); }, [saveToLocal]);

  function reorderHoles(holeList: Hole[], start: number): Hole[] {
    if (start <= 1) return holeList;
    const idx = holeList.findIndex((h) => h.holeNumber === start);
    if (idx <= 0) return holeList;
    return [...holeList.slice(idx), ...holeList.slice(0, idx)];
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/scoring/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, pin }),
      });
      if (!res.ok) {
        const data = await res.json();
        setAuthError(data.error || "Authentication failed");
        return;
      }
      const data = await res.json();
      const teamStart = data.team.startingHole ?? 1;
      setScorerId(data.scorer.id);
      setScorerPin(pin);
      setTeamName(data.team.name);
      setPlayers(data.players);
      setStartingHole(teamStart);
      setHoles(reorderHoles(data.holes, teamStart));
      setTournamentId(data.tournamentId);

      // Load existing scores from server
      const scoreMap = new Map<string, ScoreEntry>();
      for (const s of data.existingScores) {
        scoreMap.set(`${s.playerId}-${s.holeNumber}`, {
          playerId: s.playerId,
          holeNumber: s.holeNumber,
          strokes: s.strokes,
          shotgunBeer: s.shotgunBeer,
          rehit: s.rehit,
          synced: true,
        });
      }
      setScores(scoreMap);
      setAuthed(true);
    } catch {
      setAuthError("Connection error. Check your internet.");
    } finally {
      setAuthLoading(false);
    }
  }

  function getParForPlayer(hole: Hole, genderFlight: string): number {
    const teeName = getTeeBoxName(hole.holeNumber, genderFlight);
    return (hole.teeBoxes || []).find((t) => t.name === teeName)?.par || 4;
  }

  function getYardageForPlayer(hole: Hole, genderFlight: string): number | null {
    const teeName = getTeeBoxName(hole.holeNumber, genderFlight);
    return (hole.teeBoxes || []).find((t) => t.name === teeName)?.yardage ?? null;
  }

  function getScore(playerId: string, holeNumber: number): ScoreEntry {
    const key = `${playerId}-${holeNumber}`;
    const player = players.find((p) => p.id === playerId);
    const hole = holes.find((h) => h.holeNumber === holeNumber);
    const par = hole && player ? getParForPlayer(hole, player.genderFlight) : 4;
    return scores.get(key) || {
      playerId,
      holeNumber,
      strokes: par,
      shotgunBeer: false,
      rehit: false,
      synced: false,
    };
  }

  function updateScore(playerId: string, holeNumber: number, updates: Partial<ScoreEntry>) {
    const key = `${playerId}-${holeNumber}`;
    const current = getScore(playerId, holeNumber);
    const updated = { ...current, ...updates, synced: false };
    const newScores = new Map(scores);
    newScores.set(key, updated);
    setScores(newScores);

    // Debounce server sync
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => saveHoleToServer(holeNumber, newScores), 1000);
  }

  async function saveHoleToServer(holeNumber: number, scoreMap: Map<string, ScoreEntry>) {
    if (!online) return;
    setSyncing(true);
    const holeScores = players
      .map((p) => scoreMap.get(`${p.id}-${holeNumber}`))
      .filter((s): s is ScoreEntry => !!s);

    try {
      const res = await fetch("/api/scoring/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scorerId, pin: scorerPin, scores: holeScores }),
      });
      if (res.ok) {
        const newScores = new Map(scoreMap);
        for (const s of holeScores) {
          const key = `${s.playerId}-${s.holeNumber}`;
          const existing = newScores.get(key);
          if (existing) newScores.set(key, { ...existing, synced: true });
        }
        setScores(newScores);
        setLastSaved(new Date().toLocaleTimeString());
      }
    } catch { /* offline - will sync later */ }
    setSyncing(false);
  }

  async function syncPendingScores() {
    const pending = Array.from(scores.values()).filter((s) => !s.synced);
    if (pending.length === 0) return;
    setSyncing(true);
    try {
      await fetch("/api/scoring/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scorerId, pin: scorerPin, scores: pending }),
      });
      const newScores = new Map(scores);
      for (const s of pending) {
        const key = `${s.playerId}-${s.holeNumber}`;
        const existing = newScores.get(key);
        if (existing) newScores.set(key, { ...existing, synced: true });
      }
      setScores(newScores);
      setLastSaved(new Date().toLocaleTimeString());
    } catch { /* still offline */ }
    setSyncing(false);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setAuthed(false);
    setScorerId("");
    setScorerPin("");
    setFullName("");
    setPin("");
  }

  // Auth screen
  if (!authed) {
    return (
      <section className="min-h-screen bg-navy-950 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-black text-white text-center mb-2">Score Entry</h1>
          <p className="text-navy-400 text-center text-sm mb-8">Sign in with your name and scorer PIN</p>
          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="w-full rounded-xl bg-navy-900 border border-navy-700 text-white px-4 py-3.5 text-lg placeholder:text-navy-500 focus:border-gold-400 focus:outline-none"
              required
              autoComplete="name"
            />
            <input
              type="tel"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Scorer PIN"
              className="w-full rounded-xl bg-navy-900 border border-navy-700 text-white px-4 py-3.5 text-lg tracking-[0.3em] text-center placeholder:text-navy-500 placeholder:tracking-normal focus:border-gold-400 focus:outline-none"
              required
              autoComplete="off"
            />
            {authError && <p className="text-red-400 text-sm text-center">{authError}</p>}
            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-gold-400 hover:bg-gold-300 text-navy-950 font-black py-3.5 rounded-xl text-lg uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {authLoading ? "Signing in..." : "Start Scoring"}
            </button>
          </form>
        </div>
      </section>
    );
  }

  const hole = holes[currentHole];
  if (!hole) {
    return (
      <section className="min-h-screen bg-navy-950 flex items-center justify-center px-4">
        <p className="text-white text-lg">No course data available. Contact admin.</p>
      </section>
    );
  }

  const pendingCount = Array.from(scores.values()).filter((s) => !s.synced).length;

  return (
    <section className="min-h-screen bg-navy-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-navy-900/95 backdrop-blur-sm border-b border-navy-800 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <p className="text-gold-400 font-bold text-sm">{teamName}</p>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${online ? "bg-green-400" : "bg-red-400"}`} />
              <span className="text-navy-400 text-xs">
                {syncing ? "Saving..." : pendingCount > 0 ? `${pendingCount} pending` : lastSaved ? `Saved ${lastSaved}` : "Ready"}
              </span>
            </div>
          </div>
          <button onClick={logout} className="text-navy-500 hover:text-white text-xs">
            Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {/* Hole selector */}
        <div className="flex gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-hide">
          {holes.map((h, i) => {
            const allScored = players.every((p) => scores.has(`${p.id}-${h.holeNumber}`));
            return (
              <button
                key={h.holeNumber}
                onClick={() => setCurrentHole(i)}
                className={`shrink-0 w-10 h-10 rounded-lg font-bold text-sm transition-colors ${
                  i === currentHole
                    ? "bg-gold-400 text-navy-950"
                    : allScored
                    ? "bg-navy-700 text-white"
                    : "bg-navy-800 text-navy-400"
                }`}
              >
                {h.holeNumber}
              </button>
            );
          })}
        </div>

        {/* Current hole info */}
        <div className="text-center mb-6">
          <h2 className="text-5xl font-black text-white">Hole {hole.holeNumber}</h2>
          <div className="flex items-center justify-center gap-3 mt-2">
            {(hole.teeBoxes || []).map((t) => (
              <div key={t.name} className="text-center">
                <span className="text-navy-500 text-xs block">{t.name}</span>
                <span className="text-gold-400 font-bold">Par {t.par}</span>
                {t.yardage && <span className="text-navy-400 text-sm ml-1">{t.yardage}y</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Player scores */}
        <div className="space-y-3">
          {players.map((player) => {
            const score = getScore(player.id, hole.holeNumber);
            const playerPar = getParForPlayer(hole, player.genderFlight);
            const diff = score.strokes - playerPar;
            const diffColor = diff < 0 ? "text-red-400" : diff === 0 ? "text-white" : diff === 1 ? "text-navy-300" : "text-navy-500";
            const diffLabel = diff < 0 ? diff.toString() : diff === 0 ? "E" : `+${diff}`;

            return (
              <div key={player.id} className="bg-navy-900 rounded-xl p-4 border border-navy-800">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white font-semibold">{player.fullName}</p>
                    <p className="text-navy-500 text-xs">{player.genderFlight} &middot; Par {playerPar}</p>
                  </div>
                  <span className={`font-bold text-sm ${diffColor}`}>{diffLabel}</span>
                </div>

                {/* Strokes */}
                <div className="flex items-center justify-center gap-4 mb-3">
                  <button
                    onClick={() => updateScore(player.id, hole.holeNumber, { strokes: Math.max(1, score.strokes - 1) })}
                    className="w-14 h-14 rounded-xl bg-navy-800 hover:bg-navy-700 text-white text-2xl font-bold transition-colors active:scale-95"
                  >
                    -
                  </button>
                  <span className="text-5xl font-black text-white w-16 text-center tabular-nums">
                    {score.strokes}
                  </span>
                  <button
                    onClick={() => updateScore(player.id, hole.holeNumber, { strokes: Math.min(20, score.strokes + 1) })}
                    className="w-14 h-14 rounded-xl bg-navy-800 hover:bg-navy-700 text-white text-2xl font-bold transition-colors active:scale-95"
                  >
                    +
                  </button>
                </div>

                {/* Toggles */}
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => updateScore(player.id, hole.holeNumber, { shotgunBeer: !score.shotgunBeer })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      score.shotgunBeer
                        ? "bg-gold-400/20 text-gold-400 border border-gold-400/50"
                        : "bg-navy-800 text-navy-500 border border-navy-700"
                    }`}
                  >
                    <span>Shotgun $5</span>
                  </button>
                  <button
                    onClick={() => updateScore(player.id, hole.holeNumber, { rehit: !score.rehit })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      score.rehit
                        ? "bg-red-400/20 text-red-400 border border-red-400/50"
                        : "bg-navy-800 text-navy-500 border border-navy-700"
                    }`}
                  >
                    <span>Rehit</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-navy-900/95 backdrop-blur-sm border-t border-navy-800 px-4 py-3 z-40">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={() => setCurrentHole(Math.max(0, currentHole - 1))}
            disabled={currentHole === 0}
            className="bg-navy-800 hover:bg-navy-700 text-white font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-30 disabled:hover:bg-navy-800"
          >
            Prev
          </button>
          <span className="text-navy-400 text-sm font-medium">
            {currentHole + 1} of {holes.length}
          </span>
          <button
            onClick={() => setCurrentHole(Math.min(holes.length - 1, currentHole + 1))}
            disabled={currentHole === holes.length - 1}
            className="bg-gold-400 hover:bg-gold-300 text-navy-950 font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-30"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
