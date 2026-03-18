import Link from "next/link";
import { ArrowLeft, AlertTriangle, RotateCcw } from "lucide-react";

interface GameRoomNotFoundProps {
  gameType: "tic-tac-toe" | "connect4";
}

const GAME_LABELS: Record<GameRoomNotFoundProps["gameType"], string> = {
  "tic-tac-toe": "Tic-Tac-Toe",
  connect4: "Connect 4",
};

export default function GameRoomNotFound({ gameType }: GameRoomNotFoundProps) {
  const gameLabel = GAME_LABELS[gameType];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/play/${gameType}`}
            className="rounded-2xl border border-white/10 bg-white/5 p-2 hover:bg-white/15 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Room not found</h1>
            <div className="flex items-center gap-2 text-sm text-white/60 mt-0.5">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              Invalid or expired room for {gameLabel}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        The requested room doesn&apos;t exist, or it has already been closed.
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 sm:p-6 md:p-8 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto space-y-4">
          <p className="text-white/70 text-sm sm:text-base">
            Return to the lobby to join an open room, start a quick match, or create a private room.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/play/${gameType}`}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:opacity-90 transition"
            >
              <RotateCcw className="h-4 w-4" />
              Back to {gameLabel} Lobby
            </Link>
            <Link
              href="/play"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10 transition"
            >
              Browse All Games
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
