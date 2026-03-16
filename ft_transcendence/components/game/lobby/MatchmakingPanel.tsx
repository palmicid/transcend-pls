"use client";

import { Search, X } from "lucide-react";

interface MatchmakingPanelProps {
  isSearching: boolean;
  queueState: {
    status: string | null;
    position: number;
    waitSeconds: number;
  };
  onJoinQueue: () => Promise<void>;
  onLeaveQueue: () => Promise<void>;
  loading: boolean;
}

export default function MatchmakingPanel({
  isSearching,
  queueState,
  onJoinQueue,
  onLeaveQueue,
  loading,
}: MatchmakingPanelProps) {
  const showWaiting = (isSearching || queueState.status === "WAITING") && queueState.status !== "MATCHED";

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 h-full">
      <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2 mb-1">
        <Search className="h-5 w-5 text-cyan-400" />
        Quick Match
      </h2>
      <p className="text-sm text-white/50 mb-4">
        Find a real opponent automatically
      </p>

      {showWaiting ? (
        <div className="space-y-4">
          {/* Search indicator */}
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-[3px] border-transparent border-t-cyan-400 border-r-cyan-400/40 animate-spin" style={{ animationDuration: '1.2s' }} />
              <Search className="absolute inset-0 m-auto h-6 w-6 text-cyan-300 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white/80">Looking for opponent…</p>
              <div className="flex items-center justify-center gap-2 mt-1 text-xs text-white/40">
                <span>Position {queueState.position || "..."}</span>
                <span>·</span>
                <span className="tabular-nums">{queueState.waitSeconds}s</span>
              </div>
            </div>
          </div>

          <button
            onClick={onLeaveQueue}
            className="w-full rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition flex items-center justify-center gap-2"
          >
            <X className="h-4 w-4" />
            Leave Queue
          </button>
        </div>
      ) : queueState.status === "MATCHED" ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
            <Search className="h-7 w-7 text-emerald-400" />
          </div>
          <div className="text-center">
            <p className="text-emerald-400 text-lg font-bold">Match Found!</p>
            <p className="text-xs text-white/40 mt-1">Loading game…</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            onClick={onJoinQueue}
            disabled={loading || isSearching}
            className="w-full rounded-2xl bg-white text-zinc-950 px-4 py-4 font-semibold transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Search className="h-5 w-5" />
            {loading ? "Processing…" : "Find Match"}
          </button>
          <p className="text-xs text-center text-white/30">
            Automatic matchmaking with online players
          </p>
        </div>
      )}
    </div>
  );
}
