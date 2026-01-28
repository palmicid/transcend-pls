/**
 * @file RoomView.tsx
 * @description Game room view with player slots, board, and status.
 * Always displays:
 * - Player slots (X and O) with user info + connection status
 * - Game board (disabled when not in game or not your turn)
 * - Status banner
 */

"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { leaveLobbyRoom, submitTicTacToeMove, startTicTacToeGame } from "../actions";
import useGameSSE, { PlayerInfo } from "@/hooks/useGameSSE";
import { ArrowLeft, LogOut, Circle, X, Play, Loader2, User, Wifi, WifiOff } from "lucide-react";

export type GameType = "tic-tac-toe";

interface RoomViewProps {
  roomId: string;
  userId: string;
  gameType: GameType;
  initialState: string | null;
}

export default function RoomView({ roomId, userId, gameType, initialState }: RoomViewProps) {
  const router = useRouter();
  const sseUrl = `/play/tic-tac-toe/sse/${roomId}`;
  const { snapshot, isConnected, myRole, error: connectionError } = useGameSSE(
    roomId,
    sseUrl,
    Number(userId)
  );

  // Derive state from snapshot
  const roomStatus = snapshot?.status || initialState || "OPEN";
  const board = snapshot?.board || Array(9).fill(null);
  const currentTurn = snapshot?.currentTurn || "X";
  const winner = snapshot?.winner || null;
  const isDraw = snapshot?.isDraw || false;
  const players = snapshot?.players || [];

  // Game state helpers
  const isGameInProgress = roomStatus === "IN_GAME";
  const isGameEnded = roomStatus === "ENDED" || !!winner || isDraw;
  const canStartGame = roomStatus === "READY" && players.length >= 2;
  const isMyTurn = isGameInProgress && myRole === currentTurn;
  const canClickBoard = isGameInProgress && isMyTurn && !winner && !isDraw;

  // Get player by role
  const getPlayerByRole = (role: string): PlayerInfo | undefined => {
    return players.find((p) => p.role === role);
  };

  const playerX = getPlayerByRole("X");
  const playerO = getPlayerByRole("O");

  // Action handlers
  const handleStart = useCallback(async () => {
    await startTicTacToeGame(roomId);
  }, [roomId]);

  const handleMove = useCallback(
    async (cell: number) => {
      if (!canClickBoard) return;
      await submitTicTacToeMove(roomId, userId, cell);
    },
    [roomId, userId, canClickBoard]
  );

  const handleLeave = useCallback(async () => {
    await leaveLobbyRoom(roomId, userId);
    router.push("/play/tic-tac-toe");
  }, [roomId, userId, router]);

  // Render player slot
  const renderPlayerSlot = (role: "X" | "O", player?: PlayerInfo) => {
    const isX = role === "X";
    const bgColor = isX ? "bg-cyan-500/10" : "bg-fuchsia-500/10";
    const borderColor = isX ? "border-cyan-500/30" : "border-fuchsia-500/30";
    const textColor = isX ? "text-cyan-400" : "text-fuchsia-400";
    const Icon = isX ? X : Circle;
    const isCurrentTurn = isGameInProgress && currentTurn === role;
    const isMe = myRole === role;

    return (
      <div
        className={`
          rounded-2xl border p-4 ${bgColor} ${borderColor}
          ${isCurrentTurn ? "ring-2 ring-white/30" : ""}
          ${isMe ? "ring-1 ring-white/20" : ""}
        `}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${textColor}`} />
            <span className={`font-semibold ${textColor}`}>{role}</span>
            {isMe && (
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/70">
                You
              </span>
            )}
          </div>
          {player && (
            <span className="flex items-center gap-1 text-xs">
              {player.isConnected ? (
                <Wifi className="h-3 w-3 text-emerald-400" />
              ) : (
                <WifiOff className="h-3 w-3 text-red-400" />
              )}
            </span>
          )}
        </div>
        {player ? (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-white/50" />
            <span className="text-sm text-white truncate">{player.displayName}</span>
          </div>
        ) : (
          <div className="text-sm text-white/40 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Waiting...
          </div>
        )}
        {isCurrentTurn && (
          <div className={`mt-2 text-xs font-medium ${isMe ? "text-emerald-300" : "text-amber-300"}`}>
            {isMe ? "→ Your turn!" : "← Playing..."}
          </div>
        )}
      </div>
    );
  };

  // Status message
  const getStatusMessage = () => {
    if (!isConnected) return { text: "Connecting...", color: "text-white/50" };
    if (winner) {
      const didIWin = winner === myRole;
      return {
        text: didIWin ? "🎉 You Win!" : `😔 ${winner} Wins`,
        color: didIWin ? "text-emerald-300" : "text-red-300",
      };
    }
    if (isDraw) return { text: "🤝 It's a Draw!", color: "text-amber-300" };
    if (isGameInProgress) {
      return isMyTurn
        ? { text: "🎯 Your turn — make a move!", color: "text-emerald-300" }
        : { text: "⏳ Opponent's turn...", color: "text-white/60" };
    }
    if (canStartGame) return { text: "✓ Both players ready! Click Start.", color: "text-emerald-300" };
    return { text: `Waiting for players (${players.length}/2)`, color: "text-white/50" };
  };

  const status = getStatusMessage();

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
            <div className="flex items-center gap-2 text-sm text-white/60 mt-1">
              <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-400" : "bg-red-400"}`} />
              {isConnected ? "Connected" : "Connecting..."}
              {myRole && (
                <>
                  <span>•</span>
                  <span>You are <span className={myRole === "X" ? "text-cyan-400" : "text-fuchsia-400"}>{myRole}</span></span>
                </>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleLeave}
          className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Leave
        </button>
      </div>

      {connectionError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {connectionError}
        </div>
      )}

      {/* Main Game Area */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8 backdrop-blur-xl">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Player Slots */}
          <div className="grid grid-cols-2 gap-4">
            {renderPlayerSlot("X", playerX)}
            {renderPlayerSlot("O", playerO)}
          </div>

          {/* Status Banner */}
          <div className={`text-center py-3 px-4 rounded-2xl border border-white/10 bg-white/[0.02] ${status.color}`}>
            {status.text}
          </div>

          {/* Game Board */}
          <div className="grid grid-cols-3 gap-3 w-64 mx-auto">
            {board.map((cell, idx) => {
              const isCellDisabled = !canClickBoard || cell !== null;
              return (
                <button
                  key={idx}
                  onClick={() => handleMove(idx)}
                  disabled={isCellDisabled}
                  className={`
                    aspect-square rounded-2xl border-2 text-3xl font-bold transition-all duration-200
                    flex items-center justify-center
                    ${
                      cell === "X"
                        ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
                        : cell === "O"
                        ? "border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-400"
                        : canClickBoard
                        ? "border-white/10 bg-white/[0.02] hover:bg-white/[0.08] hover:border-white/20 cursor-pointer"
                        : "border-white/5 bg-white/[0.01] cursor-not-allowed opacity-50"
                    }
                  `}
                >
                  {cell === "X" && <X className="h-8 w-8" />}
                  {cell === "O" && <Circle className="h-7 w-7" />}
                </button>
              );
            })}
          </div>

          {/* Start Button */}
          <div className="flex justify-center">
            <button
              onClick={handleStart}
              disabled={!canStartGame || isGameInProgress || isGameEnded}
              className={`
                rounded-2xl px-8 py-3 font-semibold transition-all duration-200 flex items-center gap-2
                ${
                  canStartGame && !isGameInProgress && !isGameEnded
                    ? "bg-white text-zinc-950 hover:opacity-90"
                    : "bg-white/10 text-white/30 cursor-not-allowed"
                }
              `}
            >
              <Play className="h-5 w-5" />
              {isGameEnded ? "Game Over" : isGameInProgress ? "Game in Progress" : "Start Game"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
