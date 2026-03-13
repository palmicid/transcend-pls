"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Trophy, Medal, Star, ChevronRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import type { LeaderboardEntry } from "@/types/progression";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        const res = await fetch(`/api/play/leaderboard?limit=${limit}&offset=${offset}`);
        if (!res.ok) throw new Error("Failed to fetch leaderboard");
        const data = await res.json();
        
        if (offset === 0) {
          setEntries(data.entries);
          setTotal(data.total);
          setMyRank(data.myRank);
        } else {
          setEntries((prev) => [...prev, ...data.entries]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [offset]);

  const loadMore = () => setOffset((p) => p + limit);

  // Render Rank Icon
  const renderRankNumber = (rank: number) => {
    if (rank === 1) return <Trophy className="text-yellow-400 w-6 h-6" />;
    if (rank === 2) return <Medal className="text-slate-300 w-6 h-6" />;
    if (rank === 3) return <Medal className="text-amber-600 w-6 h-6" />;
    return <span className="font-bold text-slate-400 text-lg w-6 text-center">{rank}</span>;
  };

  return (
    <div className="container max-w-5xl mx-auto py-12 px-4 sm:px-6">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Global Leaderboard</h1>
        <p className="text-slate-400">Battle your way to the top of the ranks across all games.</p>
      </div>

      {myRank && myRank > limit && myRank <= total && (
        <div className="mb-8 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
              <Star size={20} />
            </div>
            <div>
              <p className="text-sm text-indigo-200">Your Current Rank</p>
              <p className="font-bold text-xl text-white">#{myRank} <span className="text-sm font-normal text-slate-400 ml-1">of {total}</span></p>
            </div>
          </div>
          <Link href="/profile" className="text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center">
            View Profile <ChevronRight size={16} />
          </Link>
        </div>
      )}

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-700/50 text-slate-400 text-sm tracking-wider uppercase">
                <th className="p-4 font-medium text-center w-20">Rank</th>
                <th className="p-4 font-medium">Player</th>
                <th className="p-4 font-medium text-center">Level</th>
                <th className="p-4 font-medium">Experience</th>
                <th className="p-4 font-medium text-right">Win Rate</th>
                <th className="p-4 font-medium text-right">Games</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => {
                const winRate = entry.totalGames > 0 ? Math.round((entry.wins / entry.totalGames) * 100) : 0;
                
                return (
                  <motion.tr 
                    key={entry.userId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="p-4 flex justify-center items-center h-full min-h-[72px]">
                      {renderRankNumber(entry.rank)}
                    </td>
                    <td className="p-4">
                      <Link href={`/profile/${entry.userId}`} className="flex items-center gap-3 group-hover:opacity-80 transition-opacity">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-700 shrink-0">
                          <Image
                            src={entry.avatarUrl || "/default-avatar.png"}
                            alt={entry.displayName}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span className="font-semibold text-slate-200">{entry.displayName}</span>
                      </Link>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg font-bold text-sm">
                        {entry.level}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-300">{entry.totalXP.toLocaleString()} XP</div>
                    </td>
                    <td className="p-4 font-medium text-slate-300 text-right">
                      <span className={winRate >= 50 ? "text-emerald-400" : "text-amber-400"}>
                        {winRate}%
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 font-medium text-right">
                      {entry.totalGames}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {entries.length === 0 && !loading && (
          <div className="p-12 text-center text-slate-500">
            No players found on the leaderboard yet. Play some matches!
          </div>
        )}
      </div>

      {offset + limit < total && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg border border-slate-700 transition-colors flex items-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
