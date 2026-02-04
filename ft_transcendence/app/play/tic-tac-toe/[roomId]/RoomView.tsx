"use client";

import { useRouter } from "next/navigation";
import { leaveLobbyRoom } from "@/app/play/actions";
import { submitTicTacToeMove, startTicTacToeGame, setBotForSlot, removeBotFromSlot, switchToSlot } from "../actions";
import useGameSSE from "@/hooks/useGameSSE";
import GameRoomShell from "@/components/game/room/GameRoomShell";
import PlayerSlotCard from "@/components/game/room/PlayerSlotCard";
import BotSlotToggle from "@/components/game/BotSlotToggle";
import {
  getLobbyState,
  getRoomStatusMessage,
  getPlayerByRole,
  isMeRole,
  getBotSlotProps,
  createLeaveHandler,
  createStartHandler,
  createMoveHandler,
  createBotHandlers,
  createSwitchHandler,
} from "@/components/game/room/roomViewUtils";
import { X, Circle, Play } from "lucide-react";

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
  const board = (snapshot?.board as (string | null)[]) || Array(9).fill(null);
  const currentTurn = snapshot?.currentTurn || "X";
  const winner = snapshot?.winner || null;
  const isDraw = snapshot?.isDraw || false;
  const players = snapshot?.players || [];
  const botConfig = snapshot?.bot || null;

  // Game state helpers
  const isGameInProgress = roomStatus === "IN_GAME";
  const isGameEnded = roomStatus === "ENDED" || !!winner || isDraw;
  const { hasBot, humanPlayerCount, canStartGame } = getLobbyState({
    roomStatus,
    players,
    bot: botConfig,
    maxPlayers: snapshot?.maxPlayers || 2,
  });

  const isMyTurn = isGameInProgress && myRole === currentTurn;
  const canClickBoard = isGameInProgress && isMyTurn && !winner && !isDraw;

  // Helpers
  const playerX = getPlayerByRole(players, "X");
  const playerO = getPlayerByRole(players, "O");
  const isMe = (role: string) => isMeRole(myRole, role);

  const handleLeave = createLeaveHandler({
    roomId,
    userId,
    router,
    redirectPath: "/play/tic-tac-toe",
    leaveFn: leaveLobbyRoom,
  });

  const handleStart = createStartHandler({
    roomId,
    startFn: startTicTacToeGame,
  });

  const handleMove = createMoveHandler<number>({
    roomId,
    userId,
    canMove: canClickBoard,
    submitFn: submitTicTacToeMove,
  });

  const { handleSetBot, handleRemoveBot } = createBotHandlers<"X" | "O">({
    roomId,
    setBotForSlot,
    removeBotFromSlot,
    onError: console.error,
  });

  const handleSwitch = createSwitchHandler<"X" | "O">({
    roomId,
    switchFn: switchToSlot,
    onError: console.error,
  });

  // Status message
  const status = getRoomStatusMessage({
    isConnected,
    winner,
    myRole,
    isDraw,
    isGameInProgress,
    isMyTurn,
    currentTurn,
    botRole: botConfig?.role ?? null,
    canStartGame,
    hasBot,
    humanPlayerCount,
    playersLength: players.length,
    maxPlayers: snapshot?.maxPlayers || 2,
    myTurnText: "🎯 Your turn — make a move!",
  });

  return (
    <GameRoomShell
      roomId={roomId}
      gameType="tic-tac-toe"
      isConnected={isConnected}
      myRole={myRole}
      onLeave={handleLeave}
      connectionError={connectionError}
    >
      <div className="max-w-lg mx-auto space-y-6">
        {/* Player Slots */}
        <div className="grid grid-cols-2 gap-4">
          <PlayerSlotCard
            role="X"
            roleIcon={<X className="h-5 w-5 text-cyan-400" />}
            player={playerX}
            isCurrentTurn={isGameInProgress && currentTurn === "X"}
            isMe={isMe("X")}
            onSwitchHere={() => handleSwitch("X")}
            isGameInProgress={isGameInProgress}
            colorClasses={{
              bg: "bg-cyan-500/10",
              border: "border-cyan-500/30",
              text: "text-cyan-400",
            }}
            action={
              <BotSlotToggle
                {...getBotSlotProps({
                  role: "X",
                  player: playerX,
                  bot: botConfig,
                  isGameInProgress,
                })}
                onSetBot={(diff) => handleSetBot("X", diff)}
                onRemoveBot={handleRemoveBot}
              />
            }
          />
          <PlayerSlotCard
            role="O"
            roleIcon={<Circle className="h-5 w-5 text-fuchsia-400" />}
            player={playerO}
            isCurrentTurn={isGameInProgress && currentTurn === "O"}
            isMe={isMe("O")}
            onSwitchHere={() => handleSwitch("O")}
            isGameInProgress={isGameInProgress}
            colorClasses={{
              bg: "bg-fuchsia-500/10",
              border: "border-fuchsia-500/30",
              text: "text-fuchsia-400",
            }}
            action={
              <BotSlotToggle
                {...getBotSlotProps({
                  role: "O",
                  player: playerO,
                  bot: botConfig,
                  isGameInProgress,
                })}
                onSetBot={(diff) => handleSetBot("O", diff)}
                onRemoveBot={handleRemoveBot}
              />
            }
          />
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
    </GameRoomShell>
  );
}
