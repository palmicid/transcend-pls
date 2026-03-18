"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { ArrowLeft, LogOut, HelpCircle, X } from "lucide-react";

interface GameRoomShellProps {
  roomId: string;
  gameType: string;
  isConnected: boolean;
  myRole: string | null;
  onLeave: () => void;
  connectionError?: string | null;
  children: ReactNode;
}

const GAME_RULES: Record<string, { title: string; rules: string[] }> = {
  "tic-tac-toe": {
    title: "How to Play",
    rules: [
      "Take turns placing X or O on a 3×3 grid.",
      "Get 3 in a row (horizontal, vertical, or diagonal) to win.",
      "If all 9 squares fill up, it's a draw.",
    ],
  },
  connect4: {
    title: "How to Play",
    rules: [
      "Take turns dropping discs into a 7-column, 6-row grid.",
      "Discs fall to the lowest available slot.",
      "Connect 4 in a row (any direction) to win.",
    ],
  },
};

export default function GameRoomShell({
  roomId,
  gameType,
  isConnected,
  myRole,
  onLeave,
  connectionError,
  children,
}: GameRoomShellProps) {
  const [showRules, setShowRules] = useState(false);
  const rules = GAME_RULES[gameType];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/play/${gameType}`}
            className="rounded-2xl border border-white/10 bg-white/5 p-2 hover:bg-white/15 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Room: {roomId}
            </h1>
            <div className="flex items-center gap-2 text-sm text-white/60 mt-0.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  isConnected ? "bg-emerald-400" : "bg-red-400"
                }`}
              />
              {isConnected ? "Connected" : "Connecting..."}
              {myRole && (
                <>
                  <span>•</span>
                  <span>
                    You are{" "}
                    <span className="text-cyan-400 font-semibold">{myRole}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {rules && (
            <button
              onClick={() => setShowRules(true)}
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 hover:bg-white/15 transition flex items-center gap-1.5"
            >
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Rules</span>
            </button>
          )}
          <button
            onClick={onLeave}
            className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Leave
          </button>
        </div>
      </div>

      {showRules && rules && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-zinc-950 p-5 sm:p-6 max-h-[90vh] overflow-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-semibold">{rules.title}</h2>
                <p className="text-sm text-white/50 mt-1">Quick in-room guide</p>
              </div>
              <button
                onClick={() => setShowRules(false)}
                className="rounded-xl border border-white/10 bg-white/5 p-2 hover:bg-white/10 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ol className="space-y-2 text-sm text-white/70 list-decimal list-inside">
              {rules.rules.map((rule, i) => (
                <li key={i}>{rule}</li>
              ))}
            </ol>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Winning Example</h3>
              {gameType === "tic-tac-toe" ? (
                <div className="grid grid-cols-3 gap-2 max-w-[220px]">
                  {["X", "X", "X", "O", null, "O", null, null, null].map((cell, index) => (
                    <div key={index} className="aspect-square rounded-lg border border-white/15 bg-black/30 grid place-items-center text-lg font-bold">
                      {cell === "X" ? <span className="text-cyan-300">X</span> : cell === "O" ? <span className="text-fuchsia-300">O</span> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1 max-w-[320px] bg-blue-900/40 p-2 rounded-xl border border-blue-500/30">
                  {Array.from({ length: 42 }, (_, index) => {
                    const row = Math.floor(index / 7);
                    const col = index % 7;
                    const isWinningRow = row === 5 && col >= 1 && col <= 4;
                    const isYellow = row === 5 && (col === 0 || col === 5);
                    return (
                      <div key={index} className="aspect-square rounded-full bg-black/40 border border-white/10 grid place-items-center">
                        <div className={`h-[72%] w-[72%] rounded-full ${isWinningRow ? "bg-red-400" : isYellow ? "bg-amber-300" : "bg-transparent"}`} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {connectionError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {connectionError}
        </div>
      )}

      {/* Main Game Area */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 sm:p-6 md:p-8 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto space-y-6">{children}</div>
      </div>
    </div>
  );
}
