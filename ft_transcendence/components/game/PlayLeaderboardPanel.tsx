"use client";

import { useEffect, useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import type { LeaderboardEntry } from "@/types/progression";

type SortMode = "xp" | "ttt";

const SORT_LABELS: Record<SortMode, string> = {
  xp: "overall",
  ttt: "tic-tac-toe",
};

export default function PlayLeaderboardPanel() {
  const [sortBy, setSortBy] = useState<SortMode>("xp");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchBoard() {
      try {
        setLoading(true);
        const response = await fetch(`/api/play/leaderboard?limit=8&offset=0&sortBy=${sortBy}`);
        if (!response.ok) throw new Error("Failed to load leaderboard");
        const data = await response.json();
        if (!cancelled) setEntries(data.entries ?? []);
      } catch {
        if (!cancelled) setEntries([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchBoard();
    return () => {
      cancelled = true;
    };
  }, [sortBy]);

  const subtitle = useMemo(() => {
    if (sortBy === "xp") return "Ranked by total XP and level.";
    return "Ranked by max wins, then best win-rate in Tic-Tac-Toe.";
  }, [sortBy]);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            Leaderboard
          </h2>
          <p className="text-sm text-white/50 mt-1">{subtitle}</p>
        </div>

        <div className="flex p-1 bg-black/20 rounded-xl border border-white/10 overflow-x-auto hide-scrollbar">
          {(["xp", "ttt"] as const).map((mode) => {
            const active = sortBy === mode;
            return (
              <button
                key={mode}
                onClick={() => setSortBy(mode)}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                {SORT_LABELS[mode]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[560px] text-left">
          <thead>
            <tr className="bg-white/[0.03] text-xs uppercase tracking-wider text-white/45">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Player</th>
              <th className="px-4 py-3 text-right">W/D/L</th>
              <th className="px-4 py-3 text-right">Winrate</th>
              <th className={`px-4 py-3 text-right ${sortBy === "xp" ? "text-fuchsia-300" : ""}`}>XP/LVL</th>
            </tr>
          </thead>
          <tbody>
            {!loading && entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-white/40">
                  No leaderboard entries yet.
                </td>
              </tr>
            )}

            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-white/40">
                  Loading leaderboard…
                </td>
              </tr>
            )}

            {!loading && entries.map((entry: LeaderboardEntry) => {
              const winRate = entry.totalGames > 0
                ? Math.round((entry.wins / entry.totalGames) * 100)
                : 0;

              return (
                <tr key={entry.userId} className="border-t border-white/5 text-sm text-white/85">
                  <td className="px-4 py-3 font-semibold text-white/60">{entry.rank}</td>
                  <td className="px-4 py-3 font-medium">{entry.displayName}</td>
                  <td className="px-4 py-3 text-right text-white/70">
                    {entry.wins}/{entry.draws}/{entry.losses}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={winRate >= 50 ? "text-emerald-400" : "text-amber-400"}>{winRate}%</span>
                  </td>
                  <td className={`px-4 py-3 text-right ${sortBy === "xp" ? "text-fuchsia-300 font-semibold" : "text-white/70"}`}>
                    {entry.totalXP.toLocaleString()} / Lv.{entry.level}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
