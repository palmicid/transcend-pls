/**
 * @file RoomView.tsx
 * @description Client component for displaying and interacting with a game room.
 *
 * Uses Server-Sent Events (SSE) for receiving real-time updates from the server,
 * and server actions for sending commands (start, pause, leave, moves).
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  leaveLobbyRoom,
} from "../actions";
import { submitTicTacToeMove, startTicTacToeGame } from "../../game/tic-tac-toe/actions";

export type GameType = "tic-tac-toe";

type Snapshot = Record<string, unknown> | null;

interface TicTacToeSnapshot {
  board: Array<"X" | "O" | null>;
  currentTurn: "X" | "O";
  winner: "X" | "O" | null;
  players: Record<string, string | null>; // { X: playerId, O: playerId }
}

interface RoomViewProps {
  roomId: string;
  userId: string;
  gameType: GameType;
  initialState: string | null;
}

export default function RoomView({ roomId, userId, gameType, initialState }: RoomViewProps) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<Snapshot>(null);
  const [roomState, setRoomState] = useState<string | null>(initialState);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Connect to SSE stream for real-time updates
  useEffect(() => {
    const subscribeUrl =
      gameType === "tic-tac-toe"
        ? `/game/tic-tac-toe/${roomId}/subscribe?userId=${encodeURIComponent(userId)}`
        : `/lobby/${roomId}/subscribe?userId=${encodeURIComponent(userId)}`;

    console.log("[SSE] Connecting to:", subscribeUrl);
    const eventSource = new EventSource(subscribeUrl);

    // Connection opened
    eventSource.addEventListener("open", () => {
      console.log("[SSE] Connected");
      setIsConnected(true);
      setConnectionError(null);
    });

    // Handle connected event
    eventSource.addEventListener("connected", (event) => {
      console.log("[SSE] Server confirmed connection:", event.data);
      setIsConnected(true);
    });

    // Handle initial state
    eventSource.addEventListener("init", (event) => {
      try {
        const payload = JSON.parse(event.data);
        console.log("[SSE] Initial state:", payload);
        if (payload.snapshot !== undefined) {
          setSnapshot(payload.snapshot as Snapshot);
        }
        if (payload.state !== undefined) {
          setRoomState(payload.state as string);
        }
      } catch (err) {
        console.error("[SSE] Failed to parse init:", err);
      }
    });

    // Handle snapshot updates
    eventSource.addEventListener("snapshot", (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.snapshot !== undefined) {
          setSnapshot(payload.snapshot as Snapshot);
        }
        if (payload.state !== undefined) {
          setRoomState(payload.state as string);
        }
      } catch (err) {
        console.error("[SSE] Failed to parse snapshot:", err);
      }
    });

    // Handle generic messages
    eventSource.addEventListener("message", (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.snapshot !== undefined) {
          setSnapshot(payload.snapshot as Snapshot);
        }
        if (payload.state !== undefined) {
          setRoomState(payload.state as string);
        }
      } catch (err) {
        console.error("[SSE] Failed to parse message:", err);
      }
    });

    // Handle errors
    eventSource.addEventListener("error", (err) => {
      console.error("[SSE] Error:", err);
      setIsConnected(false);
      if (eventSource.readyState === EventSource.CLOSED) {
        setConnectionError("Connection closed. Refresh to reconnect.");
      }
    });

    // Cleanup on unmount
    return () => {
      console.log("[SSE] Closing connection");
      eventSource.close();
    };
  }, [roomId, userId, gameType]);

  // === ACTION HANDLERS (using server actions) ===

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
    router.push("/lobby");
  }, [roomId, userId, router]);

  // === DERIVED STATE ===

  const gameLabel = gameType === "tic-tac-toe" ? "Tic-Tac-Toe" : "Generic";
  const ttt = snapshot as unknown as TicTacToeSnapshot | null;

  // Player info for Tic-Tac-Toe
  const playerX = ttt?.players?.X ?? null;
  const playerO = ttt?.players?.O ?? null;
  const myRole = ttt?.players
    ? Object.entries(ttt.players).find(([, pId]) => pId === userId)?.[0] ?? null
    : null;

  // Game state checks
  const isWaitingForPlayers = !playerX || !playerO;
  const isGameReady = roomState === "READY";
  const isGameInProgress = roomState === "IN_GAME";
  const isGameEnded = roomState === "ENDED";
  const canStartGame = isGameReady && !isWaitingForPlayers;

  const board =
    ttt?.board && Array.isArray(ttt.board) && ttt.board.length === 9
      ? ttt.board
      : Array(9).fill(null);

  return (
    <div className="min-h-screen bg-[#1e1e2e] text-[#cdd6f4] p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-[#a6e3a1]">Room {roomId}</h1>
            <div className="flex items-center gap-3 text-sm text-[#7f849c]">
              <span>
                Game: <span className="font-semibold text-[#89b4fa]">{gameLabel}</span>
              </span>
              <span>
                State:{" "}
                <span className="font-semibold text-[#cba6f7]">{roomState ?? "Loading"}</span>
              </span>
              <span>
                {isConnected ? (
                  <span className="text-[#a6e3a1]">● Connected</span>
                ) : (
                  <span className="text-[#f38ba8]">● Disconnected</span>
                )}
              </span>
            </div>
            <div className="text-sm text-[#7f849c]">
              You are signed in as{" "}
              <span className="font-semibold text-[#89dceb]">{userId}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/lobby")}
              className="px-4 py-2 rounded-md bg-[#6c7086] hover:bg-[#7f849c] text-[#cdd6f4] text-sm font-medium transition"
            >
              Back to Lobby
            </button>
            <button
              onClick={handleLeave}
              className="px-4 py-2 rounded-md bg-[#f38ba8] hover:bg-[#eba0ac] text-[#1e1e2e] text-sm font-medium transition"
            >
              Leave Room
            </button>
          </div>
        </div>

        {connectionError && (
          <div className="bg-[#f38ba8] text-[#1e1e2e] p-3 rounded-md text-sm">
            {connectionError}
          </div>
        )}

        {/* Tic-Tac-Toe Game Panel */}
        {gameType === "tic-tac-toe" && (
          <div className="bg-[#313244] rounded-lg shadow-lg p-6 border border-[#45475a] space-y-4">
            {/* Player Status Panel */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-[#1e1e2e] rounded-lg border border-[#45475a]">
              {/* Player X */}
              <div
                className={`p-3 rounded-lg border-2 ${
                  playerX
                    ? "border-[#a6e3a1] bg-[#a6e3a1]/10"
                    : "border-[#6c7086] bg-[#6c7086]/10"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-[#f9e2af]">X</span>
                  <div className="flex-1">
                    {playerX ? (
                      <div className="text-sm">
                        <span className="font-semibold text-[#a6e3a1]">{playerX}</span>
                        {playerX === userId && (
                          <span className="ml-2 text-xs text-[#89dceb]">(You)</span>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-[#6c7086] animate-pulse">
                        Waiting for player...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Player O */}
              <div
                className={`p-3 rounded-lg border-2 ${
                  playerO
                    ? "border-[#a6e3a1] bg-[#a6e3a1]/10"
                    : "border-[#6c7086] bg-[#6c7086]/10"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-[#89b4fa]">O</span>
                  <div className="flex-1">
                    {playerO ? (
                      <div className="text-sm">
                        <span className="font-semibold text-[#a6e3a1]">{playerO}</span>
                        {playerO === userId && (
                          <span className="ml-2 text-xs text-[#89dceb]">(You)</span>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-[#6c7086] animate-pulse">
                        Waiting for player...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Your Role Display */}
            {myRole && (
              <div className="text-center py-2">
                <span className="text-sm text-[#7f849c]">You are playing as </span>
                <span
                  className={`text-xl font-bold ${
                    myRole === "X" ? "text-[#f9e2af]" : "text-[#89b4fa]"
                  }`}
                >
                  {myRole}
                </span>
              </div>
            )}

            {/* Waiting Message */}
            {isWaitingForPlayers && !isGameInProgress && (
              <div className="text-center py-4 bg-[#1e1e2e] rounded-lg border border-[#f9e2af]/50">
                <div className="text-lg font-semibold text-[#f9e2af] animate-pulse">
                  ⏳ Waiting for opponent to join...
                </div>
                <div className="text-sm text-[#7f849c] mt-1">
                  Share this room ID: <span className="font-mono text-[#89dceb]">{roomId}</span>
                </div>
              </div>
            )}

            {/* Ready to Start Message */}
            {canStartGame && !isGameInProgress && !isGameEnded && (
              <div className="text-center py-4 bg-[#a6e3a1]/10 rounded-lg border border-[#a6e3a1]/50">
                <div className="text-lg font-semibold text-[#a6e3a1]">
                  ✓ Both players ready!
                </div>
                <div className="text-sm text-[#7f849c] mt-1">
                  Click &quot;Start Game&quot; to begin
                </div>
              </div>
            )}

            {/* Game Board - Only show when game is in progress or ended */}
            {(isGameInProgress || isGameEnded) && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#7f849c]">
                    Current Turn:{" "}
                    <span
                      className={`font-semibold ${
                        ttt?.currentTurn === "X" ? "text-[#f9e2af]" : "text-[#89b4fa]"
                      }`}
                    >
                      {ttt?.currentTurn ?? "?"}
                    </span>
                    {ttt?.currentTurn === myRole && (
                      <span className="ml-2 text-[#a6e3a1]">(Your turn!)</span>
                    )}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 w-48 mx-auto">
                  {board.map((cell, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleMove(idx)}
                      className={`border-2 bg-[#1e1e2e] h-16 text-2xl font-bold transition
                        ${cell === "X" ? "text-[#f9e2af]" : cell === "O" ? "text-[#89b4fa]" : "text-[#a6e3a1]"}
                        ${
                          !ttt?.winner && cell === null && ttt?.currentTurn === myRole
                            ? "border-[#89dceb] hover:bg-[#45475a] cursor-pointer"
                            : "border-[#45475a] cursor-not-allowed opacity-70"
                        }
                      `}
                      disabled={
                        (ttt?.winner ?? null) !== null ||
                        cell !== null ||
                        ttt?.currentTurn !== myRole
                      }
                    >
                      {cell}
                    </button>
                  ))}
                </div>
                {ttt?.winner && (
                  <div className="text-center mt-4 py-3 bg-[#a6e3a1]/10 rounded-lg border border-[#a6e3a1]">
                    <p className="text-xl font-bold text-[#a6e3a1]">
                      🎉 {ttt.winner === myRole ? "You Win!" : `Player ${ttt.winner} Wins!`}
                    </p>
                  </div>
                )}
                {!ttt?.winner && board.every((c) => c !== null) && (
                  <div className="text-center mt-4 py-3 bg-[#f9e2af]/10 rounded-lg border border-[#f9e2af]">
                    <p className="text-xl font-bold text-[#f9e2af]">🤝 It&apos;s a Draw!</p>
                  </div>
                )}
              </div>
            )}

            {/* Controls */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-[#45475a]">
              <button
                onClick={handleStart}
                disabled={!canStartGame || isGameInProgress}
                className={`px-4 py-2 rounded-md text-sm font-medium transition
                  ${
                    canStartGame && !isGameInProgress
                      ? "bg-[#a6e3a1] hover:bg-[#94e2d5] text-[#1e1e2e]"
                      : "bg-[#6c7086] text-[#45475a] cursor-not-allowed"
                  }
                `}
              >
                {isGameInProgress ? "Game in Progress" : "Start Game"}
              </button>
            </div>
          </div>
        )}


      </div>
    </div>
  );
}
