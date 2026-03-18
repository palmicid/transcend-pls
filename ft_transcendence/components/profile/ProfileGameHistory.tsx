"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Clock, Gamepad2, ChevronRight, ChevronLeft, Calendar as CalendarIcon, Info } from "lucide-react";
import type { ProfileGameSummary } from "@/types/profile";
import type { AchievementDef } from "@/types/progression";
import XPBar from "./XPBar";
import { GameRegistry } from "@/lib/game/GameRegistry";

interface ProfileGameHistoryProps {
  games: ProfileGameSummary[];
  level: number;
  totalXP: number;
  unlockedAchievements: string[];
  allAchievements: AchievementDef[];
}

export default function ProfileGameHistory({
  games,
  level,
  totalXP,
  unlockedAchievements,
  allAchievements,
}: ProfileGameHistoryProps) {
  const [page, setPage] = useState(1);
  const itemsPerPage = 3;

  // Filter games (only Tic-Tac-Toe)
  const filteredGames = games.filter((g) => g.gameType === "tic-tac-toe");

  // Pagination
  const totalPages = Math.ceil(filteredGames.length / itemsPerPage);
  const currentGames = filteredGames.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const getResultColor = (result: string) => {
    switch (result) {
      case "win": return "text-emerald-400";
      case "loss": return "text-red-400";
      case "draw": return "text-amber-400";
      default: return "text-slate-400";
    }
  };

  const getTicTacToeBoard = (board: unknown): Array<"X" | "O" | null> | null => {
    if (!Array.isArray(board) || board.length !== 9) return null;
    return board.map((cell) => {
      if (cell === "X" || cell === "O") return cell;
      return null;
    });
  };

  const gameDef = GameRegistry.get("tic-tac-toe");

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* XP & Level Section */}
      <XPBar xp={{ level, totalXP }} />

      {/* Game History Section */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] overflow-hidden">
        {/* Header */}
        <div className="border-b border-white/10 bg-white/5 p-4 sm:px-6 sm:py-5 flex items-center gap-2">
          <Gamepad2 className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-semibold tracking-tight text-white">Match History</h2>
        </div>

        {/* XP Tooltip Info */}
        <div className="bg-white/[0.02] px-4 py-3 sm:px-6 border-b border-white/5 flex items-center gap-2 text-xs text-white/50">
          <Info className="h-4 w-4 text-cyan-400/70 shrink-0" />
          <span>
            <strong className="text-white/80">XP Rewards:</strong>{" "}
            Win {"+"}{Math.floor((gameDef?.xpReward.base ?? 0) * (gameDef?.xpReward.winMultiplier ?? 0))} · Draw {"+"}{Math.floor((gameDef?.xpReward.base ?? 0) * (gameDef?.xpReward.drawMultiplier ?? 0))} · Loss {"+"}{Math.floor((gameDef?.xpReward.base ?? 0) * (gameDef?.xpReward.lossMultiplier ?? 0))}
            {" | Bot games award 1 XP"}
          </span>
        </div>

        {/* Games List */}
        <div className="p-4 sm:p-6 space-y-3">
          {currentGames.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
              <CalendarIcon className="h-8 w-8 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">No Tic-Tac-Toe matches played yet.</p>
              <p className="text-white/25 text-xs mt-1">Visit the Game Lobby to start playing!</p>
            </div>
          ) : (
            currentGames.map((game) => (
              <div
                key={game.id}
                className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition"
              >
                {/* Board Preview */}
                <div className="shrink-0 flex justify-center sm:block">
                  <div className="w-20 h-20 rounded-xl overflow-hidden shadow-inner border border-white/10 bg-black/40 p-1.5">
                    {getTicTacToeBoard(game.finalBoard) ? (
                      <div className="grid grid-cols-3 gap-1 h-full w-full">
                        {getTicTacToeBoard(game.finalBoard)!.map((cell, index) => (
                          <div key={index} className="rounded-[4px] border border-white/10 bg-white/[0.03] grid place-items-center text-[10px] font-bold">
                            {cell === "X" ? <span className="text-cyan-300">X</span> : cell === "O" ? <span className="text-fuchsia-300">O</span> : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="w-full h-full rounded-lg border border-dashed border-white/15 grid place-items-center text-[10px] text-white/40">
                        No board
                      </div>
                    )}
                  </div>
                </div>

                {/* Match Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-center text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <h3 className={`font-bold uppercase tracking-wider text-sm ${getResultColor(game.result)}`}>
                      {game.result === "win" ? "VICTORY" : game.result === "loss" ? "DEFEAT" : "DRAW"}
                    </h3>
                    <span className="text-xs text-white/40 flex items-center justify-center sm:justify-end gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(game.startedAt), "MMM d, yyyy • h:mm a")}
                    </span>
                  </div>

                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
                    <img
                      src={game.opponent.avatarUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%230b0f1a' width='32' height='32'/%3E%3Ccircle cx='16' cy='12' r='6' fill='%23334155'/%3E%3Crect x='7' y='21' width='18' height='8' rx='4' fill='%23334155'/%3E%3C/svg%3E"}
                      alt={`${game.opponent.displayName} avatar`}
                      className="h-7 w-7 rounded-full border border-white/15 object-cover"
                    />
                    <span className="text-xs text-white/70">
                      vs <span className="font-medium text-white/90">{game.opponent.displayName}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-center sm:justify-start gap-4 mt-1.5 pt-1.5 border-t border-white/5">
                    <div className="text-xs text-white/50">
                      Duration: <span className="text-white/80 font-medium">{Math.floor((game.durationMs || 0) / 60000)}m {Math.round(((game.durationMs || 0) % 60000) / 1000)}s</span>
                    </div>
                    {game.xpEarned > 0 && (
                      <div className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                        +{game.xpEarned} XP
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 sm:px-6 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-xs font-medium text-white/40">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Achievements Section */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 sm:p-6 overflow-hidden relative">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold tracking-tight text-white">Achievements</h2>
          <span className="text-xs font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 rounded-full px-2.5 py-1">
            {unlockedAchievements.length}/{allAchievements.length} unlocked
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {allAchievements.map((ach) => {
            const isUnlocked = unlockedAchievements.includes(ach.id);
            return (
              <div
                key={ach.id}
                className={`p-3 rounded-2xl border transition-all ${
                  isUnlocked
                    ? "bg-cyan-500/10 border-cyan-500/35 shadow-[inset_0_0_20px_rgba(34,211,238,0.12)] hover:border-cyan-400/60 hover:bg-cyan-500/15"
                    : "bg-white/[0.02] border-white/5 opacity-70"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-white/90 truncate">{ach.name}</div>
                  {isUnlocked ? (
                    <span className="text-[10px] uppercase tracking-wide text-cyan-300">Unlocked</span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wide text-white/35">Locked</span>
                  )}
                </div>
                <div className="text-[10px] text-white/50 mt-1 h-8 leading-tight overflow-hidden">
                  {ach.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
