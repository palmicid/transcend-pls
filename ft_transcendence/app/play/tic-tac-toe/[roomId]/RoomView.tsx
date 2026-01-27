/**
 * @file RoomView.tsx
 * @description Client component for displaying and interacting with a Tic-Tac-Toe game room.
 * Uses glassmorphism design matching the main application theme.
 */

"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { leaveLobbyRoom, submitTicTacToeMove, startTicTacToeGame } from "../actions";
import useGameSSE from "@/hooks/useGameSSE";
import { ArrowLeft, LogOut, Circle, X, Play, Loader2 } from "lucide-react";

export type GameType = "tic-tac-toe";

interface RoomViewProps {
  roomId: string;
  userId: string;
  gameType: GameType;
  initialState: string | null;
  sseToken: string;
}

export default function RoomView({ roomId, userId, gameType, initialState, sseToken }: RoomViewProps) {
  const router = useRouter();

  // Use resilient SSE hook
  const { snapshot, isConnected, error: connectionError } = useGameSSE(
    roomId,
    sseToken,
    `/play/tic-tac-toe/sse/${roomId}`
  );

  // Derive game state
  const roomStatus = (snapshot?.status as string) || initialState;
  const currentBoard = (snapshot?.board as (string | null)[]) || Array(9).fill(null);
  const currentTurn = (snapshot?.currentTurn as string) || "X";
  const winner = snapshot?.winner as string | null;
  const isDraw = snapshot?.is_draw as boolean;

  // === ACTION HANDLERS ===

  const handleStart = useCallback(async () => {
    if (gameType === "tic-tac-toe") {
      await startTicTacToeGame(roomId);
    }
  }, [roomId, gameType]);

  const handleMove = useCallback(
    async (cell: number) => {
      await submitTicTacToeMove(roomId, userId, cell);
    },
    [roomId, userId]
  );

  const handleLeave = useCallback(async () => {
    await leaveLobbyRoom(roomId, userId);
    router.push("/play/tic-tac-toe");
  }, [roomId, userId, router]);

  // === UI HELPERS ===

  const canStartGame = roomStatus === "READY";
  const isGameInProgress = roomStatus === "IN_GAME";
  const isGameEnded = roomStatus === "ENDED";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/play/tic-tac-toe"
            className="rounded-2xl border border-white/10 bg-white/5 p-2 hover:bg-white/15 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Room: {roomId}
            </h1>
            <div className="flex items-center gap-3 text-sm text-white/60 mt-1">
              <span className="flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isConnected ? "bg-emerald-400" : "bg-red-400"
                  }`}
                />
                {isConnected ? "Connected" : "Disconnected"}
              </span>
              <span>•</span>
              <span>
                Status:{" "}
                <span
                  className={`font-semibold ${
                    roomStatus === "IN_GAME"
                      ? "text-amber-300"
                      : roomStatus === "READY"
                      ? "text-emerald-300"
                      : roomStatus === "ENDED"
                      ? "text-cyan-300"
                      : "text-white/70"
                  }`}
                >
                  {roomStatus ?? "Loading..."}
                </span>
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            Playing as: <span className="font-semibold text-cyan-300">{userId}</span>
          </span>
          <button
            onClick={handleLeave}
            className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Leave
          </button>
        </div>
      </div>

      {connectionError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {connectionError}
        </div>
      )}

      {/* Game Panel */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8 backdrop-blur-xl">
        <div className="max-w-md mx-auto space-y-6">
          {/* Status Message */}
          {!isGameInProgress && !winner && !isDraw && (
            <div className="text-center py-4 px-6 rounded-2xl border border-white/10 bg-white/[0.02]">
              {canStartGame ? (
                <div className="text-emerald-300 font-medium">
                  ✓ Both players ready! Click Start to begin.
                </div>
              ) : (
                <div className="text-white/50 flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Waiting for players to join...
                </div>
              )}
            </div>
          )}

          {/* Current Turn Indicator */}
          {(isGameInProgress || isGameEnded || winner) && !isDraw && !winner && (
            <div className="text-center">
              <span className="text-white/60">Current Turn: </span>
              <span
                className={`text-xl font-bold ${
                  currentTurn === "X" ? "text-cyan-400" : "text-fuchsia-400"
                }`}
              >
                {currentTurn}
              </span>
            </div>
          )}

          {/* Game Board */}
          {(isGameInProgress || isGameEnded || winner || isDraw) && (
            <div className="grid grid-cols-3 gap-3 w-64 mx-auto">
              {currentBoard.map((cell, idx) => (
                <button
                  key={idx}
                  onClick={() => handleMove(idx)}
                  className={`
                    aspect-square rounded-2xl border-2 text-3xl font-bold transition-all duration-200
                    flex items-center justify-center
                    ${
                      cell === "X"
                        ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
                        : cell === "O"
                        ? "border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-400"
                        : !winner && !isDraw
                        ? "border-white/10 bg-white/[0.02] hover:bg-white/[0.08] hover:border-white/20 cursor-pointer"
                        : "border-white/5 bg-white/[0.01] cursor-not-allowed"
                    }
                  `}
                  disabled={!!winner || !!isDraw || cell !== null}
                >
                  {cell === "X" && <X className="h-8 w-8" />}
                  {cell === "O" && <Circle className="h-7 w-7" />}
                </button>
              ))}
            </div>
          )}

          {/* Winner/Draw Announcement */}
          {winner && (
            <div className="text-center py-6 px-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
              <p className="text-2xl font-bold text-emerald-300">
                🎉 {winner} Wins!
              </p>
            </div>
          )}
          {isDraw && (
            <div className="text-center py-6 px-6 rounded-2xl border border-amber-500/30 bg-amber-500/10">
              <p className="text-2xl font-bold text-amber-300">
                🤝 It&apos;s a Draw!
              </p>
            </div>
          )}

          {/* Start Button */}
          <div className="flex justify-center">
            <button
              onClick={handleStart}
              disabled={!canStartGame || isGameInProgress}
              className={`
                rounded-2xl px-8 py-3 font-semibold transition-all duration-200 flex items-center gap-2
                ${
                  canStartGame && !isGameInProgress
                    ? "bg-white text-zinc-950 hover:opacity-90"
                    : "bg-white/10 text-white/30 cursor-not-allowed"
                }
              `}
            >
              <Play className="h-5 w-5" />
              {isGameInProgress ? "Game in Progress" : "Start Game"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
