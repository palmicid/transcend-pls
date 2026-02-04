"use client";

import { useRouter } from "next/navigation";
import { leaveLobbyRoom } from "@/app/play/actions";
import { submitConnect4Move, startConnect4Game, setBotForSlot, removeBotFromSlot, switchToSlot } from "../actions";
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
import { Play } from "lucide-react";

interface RoomViewProps {
  roomId: string;
  userId: string;
  initialState: string | null;
}

export default function RoomView({ roomId, userId, initialState }: RoomViewProps) {
  const router = useRouter();
  const sseUrl = `/play/connect4/sse/${roomId}`;
  const { snapshot, isConnected, myRole, error: connectionError } = useGameSSE(
    roomId,
    sseUrl,
    Number(userId)
  );

  // Derive state from snapshot
  const roomStatus = snapshot?.status || initialState || "OPEN";
  const board = (snapshot?.board as (string | null)[][]) || Array(6).fill(null).map(() => Array(7).fill(null));
  const currentTurn = snapshot?.currentTurn || "Red";
  const winner = snapshot?.winner || null;
  const isDraw = snapshot?.isDraw || false;
  const players = snapshot?.players || [];
  const botConfig = snapshot?.bot;

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
  const playerRed = getPlayerByRole(players, "Red");
  const playerYellow = getPlayerByRole(players, "Yellow");
  const isMe = (role: string) => isMeRole(myRole, role);

  const handleLeave = createLeaveHandler({
    roomId,
    userId,
    router,
    redirectPath: "/play/connect4",
    leaveFn: leaveLobbyRoom,
  });

  const handleStart = createStartHandler({
    roomId,
    startFn: startConnect4Game,
  });

  const handleMove = createMoveHandler<number>({
    roomId,
    userId,
    canMove: canClickBoard,
    submitFn: submitConnect4Move,
  });

  const { handleSetBot, handleRemoveBot } = createBotHandlers<"Red" | "Yellow">({
    roomId,
    setBotForSlot,
    removeBotFromSlot,
    onError: console.error,
  });

  const handleSwitch = createSwitchHandler<"Red" | "Yellow">({
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
    myTurnText: "🎯 Your turn — click a column!",
  });

  return (
    <GameRoomShell
      roomId={roomId}
      gameType="connect4"
      isConnected={isConnected}
      myRole={myRole}
      onLeave={handleLeave}
      connectionError={connectionError}
    >
      <div className="max-w-lg mx-auto space-y-6">
        {/* Player Slots */}
        <div className="grid grid-cols-2 gap-4">
          <PlayerSlotCard
            role="Red"
            roleIcon={<div className="h-4 w-4 rounded-full bg-red-500" />}
            player={playerRed}
            isCurrentTurn={isGameInProgress && currentTurn === "Red"}
            isMe={isMe("Red")}
            onSwitchHere={() => handleSwitch("Red")}
            isGameInProgress={isGameInProgress}
            colorClasses={{
              bg: "bg-red-500/10",
              border: "border-red-500/30",
              text: "text-red-400",
            }}
            action={
              <BotSlotToggle
                {...getBotSlotProps({
                  role: "Red",
                  player: playerRed,
                  bot: botConfig,
                  isGameInProgress,
                })}
                onSetBot={(diff) => handleSetBot("Red", diff)}
                onRemoveBot={handleRemoveBot}
              />
            }
          />
          <PlayerSlotCard
            role="Yellow"
            roleIcon={<div className="h-4 w-4 rounded-full bg-yellow-400" />}
            player={playerYellow}
            isCurrentTurn={isGameInProgress && currentTurn === "Yellow"}
            isMe={isMe("Yellow")}
            onSwitchHere={() => handleSwitch("Yellow")}
            isGameInProgress={isGameInProgress}
            colorClasses={{
              bg: "bg-yellow-500/10",
              border: "border-yellow-500/30",
              text: "text-yellow-400",
            }}
            action={
              <BotSlotToggle
                {...getBotSlotProps({
                  role: "Yellow",
                  player: playerYellow,
                  bot: botConfig,
                  isGameInProgress,
                })}
                onSetBot={(diff) => handleSetBot("Yellow", diff)}
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
        <div className="bg-blue-600 p-4 rounded-xl shadow-2xl relative">
          <div className="grid grid-cols-7 gap-2 md:gap-3">
             {/* Columns */}
             {Array.from({ length: 7 }).map((_, colIndex) => {
               const isColumnFull = board[0][colIndex] !== null;
               const isClickable = canClickBoard && !isColumnFull;

               return (
                 <div
                   key={colIndex}
                   className={`
                      flex flex-col gap-2 md:gap-3 rounded-lg p-1 transition-colors
                      ${isClickable ? "cursor-pointer hover:bg-white/10" : "cursor-default"}
                   `}
                   onClick={() => handleMove(colIndex)}
                 >
                    {/* Rows */}
                    {Array.from({ length: 6 }).map((_, rowIndex) => {
                        const cell = board[rowIndex][colIndex];
                        return (
                            <div
                              key={rowIndex}
                              className={`
                                  aspect-square rounded-full border-4 border-blue-700 shadow-inner
                                  ${cell === 'Red' ? 'bg-red-500' :
                                    cell === 'Yellow' ? 'bg-yellow-400' : 'bg-[#1e3a8a]'}
                              `}
                            />
                        );
                    })}
                 </div>
               );
             })}
          </div>
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

