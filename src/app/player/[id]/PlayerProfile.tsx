"use client";

import { useState } from "react";

interface Award {
  year: number;
  category: string;
  description: string | null;
}

interface TournamentScore {
  holeNumber: number;
  strokes: number;
  par: number;
  shotgunBeer: boolean;
  rehit: boolean;
}

interface TournamentResult {
  year: number;
  flight: string;
  teamName: string;
  totalStrokes: number;
  toPar: number;
  holesPlayed: number;
  beers: number;
  paymentStatus: string;
  scores: TournamentScore[];
}

const CATEGORY_LABELS: Record<string, string> = {
  mens_individual: "Men's Champion",
  womens_individual: "Women's Champion",
  team: "Winning Team",
  shotgun_champion: "Shotgun Champion",
  special_award: "Special Award",
  fan_vote: "Fan Vote",
};

function formatToPar(toPar: number) {
  if (toPar < 0) return toPar.toString();
  if (toPar === 0) return "E";
  return `+${toPar}`;
}

export default function PlayerProfile({
  name,
  avatarUrl,
  bio,
  yearsPlayed,
  totalRounds,
  totalHoles,
  totalBeers,
  bestToPar,
  avgToPar,
  totalDonated,
  awards,
  tournaments,
}: {
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  yearsPlayed: number;
  totalRounds: number;
  totalHoles: number;
  totalBeers: number;
  bestToPar: number | null;
  avgToPar: number | null;
  totalDonated: number;
  awards: Award[];
  tournaments: TournamentResult[];
}) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <>
      {/* Hero */}
      <section className="bg-navy-950 text-white py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-6">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="w-20 h-20 rounded-full border-2 border-gold-400"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-navy-800 border-2 border-gold-400 flex items-center justify-center text-2xl font-bold text-gold-400">
                {name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-black">{name}</h1>
              {yearsPlayed > 1 && (
                <span className="inline-block mt-1 text-xs bg-gold-400/20 text-gold-400 px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
                  Returning Player
                </span>
              )}
              {yearsPlayed > 0 && (
                <p className="text-navy-400 text-sm mt-1">
                  {yearsPlayed} tournament{yearsPlayed !== 1 ? "s" : ""} played
                </p>
              )}
            </div>
          </div>
          {bio && <p className="mt-6 text-navy-300">{bio}</p>}
        </div>
      </section>

      {/* Career Stats */}
      {totalRounds > 0 && (
        <section className="py-8 bg-navy-900">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="text-sm font-bold text-navy-400 uppercase tracking-wider mb-4">Career Stats</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-navy-800 rounded-xl p-4">
                <p className="text-navy-400 text-xs">Rounds</p>
                <p className="text-2xl font-bold text-white">{totalRounds}</p>
              </div>
              {bestToPar !== null && (
                <div className="bg-navy-800 rounded-xl p-4">
                  <p className="text-navy-400 text-xs">Best Round</p>
                  <p className="text-2xl font-bold text-white">{formatToPar(bestToPar)}</p>
                </div>
              )}
              {avgToPar !== null && (
                <div className="bg-navy-800 rounded-xl p-4">
                  <p className="text-navy-400 text-xs">Avg Score</p>
                  <p className="text-2xl font-bold text-white">
                    {avgToPar < 0 ? avgToPar.toFixed(1) : avgToPar === 0 ? "E" : `+${avgToPar.toFixed(1)}`}
                  </p>
                </div>
              )}
              <div className="bg-navy-800 rounded-xl p-4">
                <p className="text-navy-400 text-xs">Total Holes</p>
                <p className="text-2xl font-bold text-white">{totalHoles}</p>
              </div>
              {totalBeers > 0 && (
                <div className="bg-navy-800 rounded-xl p-4">
                  <p className="text-navy-400 text-xs">Shotguns</p>
                  <p className="text-2xl font-bold text-gold-400">{totalBeers}</p>
                </div>
              )}
              {totalDonated > 0 && (
                <div className="bg-navy-800 rounded-xl p-4">
                  <p className="text-navy-400 text-xs">Donated</p>
                  <p className="text-2xl font-bold text-gold-400">${totalDonated}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Awards */}
      {awards.length > 0 && (
        <section className="py-8 bg-navy-950">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="text-sm font-bold text-navy-400 uppercase tracking-wider mb-4">Awards</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {awards.map((award, i) => (
                <div key={i} className="bg-navy-900 border border-navy-800 rounded-xl px-5 py-4">
                  <p className="text-gold-400 font-bold text-sm">{award.year}</p>
                  <p className="text-white font-semibold">{CATEGORY_LABELS[award.category] || award.category}</p>
                  {award.description && <p className="text-navy-400 text-sm mt-1">{award.description}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Tournament History */}
      <section className="py-12 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl font-bold text-navy-900 mb-6">Tournament History</h2>
          {tournaments.length === 0 ? (
            <p className="text-navy-400">No tournament registrations yet.</p>
          ) : (
            <div className="space-y-3">
              {tournaments.map((t) => (
                <div key={t.year} className="border border-navy-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpanded(expanded === t.year ? null : t.year)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-navy-50 transition-colors text-left"
                  >
                    <div>
                      <p className="font-semibold text-navy-900">{t.year}</p>
                      <div className="flex gap-3 text-sm text-navy-500 mt-0.5">
                        <span>{t.flight}</span>
                        {t.teamName && <span>Team: {t.teamName}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      {t.holesPlayed > 0 ? (
                        <>
                          <p className="font-bold text-navy-900">
                            {formatToPar(t.toPar)}
                            <span className="text-navy-400 font-normal text-sm ml-1">({t.totalStrokes})</span>
                          </p>
                          <p className="text-xs text-navy-400">
                            {t.holesPlayed} holes{t.beers > 0 ? ` / ${t.beers} beer${t.beers !== 1 ? "s" : ""}` : ""}
                          </p>
                        </>
                      ) : (
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          t.paymentStatus === "paid_online" || t.paymentStatus === "paid_manual"
                            ? "bg-navy-100 text-navy-600" : "bg-gold-50 text-gold-600"
                        }`}>
                          {t.paymentStatus === "paid_online" || t.paymentStatus === "paid_manual" ? "Confirmed" : "Registered"}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Expandable scorecard */}
                  {expanded === t.year && t.scores.length > 0 && (
                    <div className="border-t border-navy-100 p-4 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-navy-400">
                            <th className="text-left px-1.5 py-1">Hole</th>
                            {t.scores.map((s) => (
                              <th key={s.holeNumber} className="px-1.5 py-1 text-center w-8">{s.holeNumber}</th>
                            ))}
                            <th className="px-1.5 py-1 text-center font-bold">Tot</th>
                          </tr>
                          <tr className="text-navy-500">
                            <td className="px-1.5 py-0.5">Par</td>
                            {t.scores.map((s) => (
                              <td key={s.holeNumber} className="px-1.5 py-0.5 text-center">{s.par}</td>
                            ))}
                            <td className="px-1.5 py-0.5 text-center">{t.scores.reduce((sum, s) => sum + s.par, 0)}</td>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="text-navy-900 font-medium">
                            <td className="px-1.5 py-1">Score</td>
                            {t.scores.map((s) => {
                              const diff = s.strokes - s.par;
                              const bg = diff <= -2 ? "bg-gold-400 text-navy-950 rounded"
                                : diff === -1 ? "bg-red-100 text-red-700 rounded"
                                : diff >= 2 ? "bg-navy-100 text-navy-500 rounded" : "";
                              return (
                                <td key={s.holeNumber} className="px-1.5 py-1 text-center">
                                  <span className={`inline-block w-6 h-6 leading-6 text-center ${bg}`}>{s.strokes}</span>
                                </td>
                              );
                            })}
                            <td className="px-1.5 py-1 text-center font-bold">{t.totalStrokes}</td>
                          </tr>
                          {t.scores.some((s) => s.shotgunBeer) && (
                            <tr className="text-gold-500">
                              <td className="px-1.5 py-0.5">Beer</td>
                              {t.scores.map((s) => (
                                <td key={s.holeNumber} className="px-1.5 py-0.5 text-center">
                                  {s.shotgunBeer ? "$5" : ""}
                                </td>
                              ))}
                              <td className="px-1.5 py-0.5 text-center">${t.beers * 5}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
