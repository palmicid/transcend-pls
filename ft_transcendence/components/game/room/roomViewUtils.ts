/**
 * @file components/game/room/roomViewUtils.ts
 * @description Shared helpers for game room views (TTT, Connect4, etc.).
 */

import type { BotConfig, PlayerInfo, RoomStatus } from "@/types/game";

export interface LobbyState {
  isLobby: boolean;
  hasBot: boolean;
  humanPlayerCount: number;
  canStartGame: boolean;
}

export interface StatusMessage {
  text: string;
  color: string;
}

export function getPlayerByRole(players: PlayerInfo[], role: string) {
  return players.find((p) => p.role === role);
}

export function isMeRole(myRole: string | null, role: string): boolean {
  return myRole === role;
}

export function getBotSlotProps(params: {
  role: string;
  player?: PlayerInfo;
  bot?: BotConfig | null;
  isGameInProgress: boolean;
}) {
  const { role, player, bot, isGameInProgress } = params;
  const isBot = !!player?.isBot;
  const isEmpty = !player && (!bot || bot.role !== role);
  const currentDifficulty = bot?.role === role ? bot.difficulty : null;

  return {
    isBot,
    isEmpty,
    currentDifficulty,
    disabled: isGameInProgress,
  };
}

export function createLeaveHandler(params: {
  roomId: string;
  userId: string;
  router: { push: (path: string) => void };
  redirectPath: string;
  leaveFn: (roomId: string, userId: string) => Promise<unknown>;
}) {
  const { roomId, userId, router, redirectPath, leaveFn } = params;
  return async () => {
    await leaveFn(roomId, userId);
    router.push(redirectPath);
  };
}

export function createStartHandler(params: {
  roomId: string;
  startFn: (roomId: string) => Promise<unknown>;
}) {
  const { roomId, startFn } = params;
  return async () => {
    await startFn(roomId);
  };
}

export function createMoveHandler<TMove>(params: {
  roomId: string;
  userId: string;
  canMove: boolean;
  submitFn: (roomId: string, userId: string, move: TMove) => Promise<unknown>;
}) {
  const { roomId, userId, canMove, submitFn } = params;
  return async (move: TMove) => {
    if (!canMove) return;
    await submitFn(roomId, userId, move);
  };
}

export function createBotHandlers<TRole extends string>(params: {
  roomId: string;
  setBotForSlot: (args: { roomId: string; role: TRole; difficulty: 1 | 3 | 9 }) => Promise<{ error?: string } | void>;
  removeBotFromSlot: (roomId: string) => Promise<{ error?: string } | void>;
  onError?: (message: string) => void;
}) {
  const { roomId, setBotForSlot, removeBotFromSlot, onError } = params;

  const handleSetBot = async (role: TRole, difficulty: 1 | 3 | 9) => {
    const res = await setBotForSlot({ roomId, role, difficulty });
    if (res && res.error && onError) onError(res.error);
  };

  const handleRemoveBot = async () => {
    const res = await removeBotFromSlot(roomId);
    if (res && res.error && onError) onError(res.error);
  };

  return { handleSetBot, handleRemoveBot };
}

export function getLobbyState(params: {
  roomStatus: RoomStatus | string | null | undefined;
  players: PlayerInfo[];
  bot?: BotConfig | null;
  maxPlayers?: number;
}): LobbyState {
  const { roomStatus, players, bot, maxPlayers } = params;
  const isLobby = roomStatus === "OPEN" || roomStatus === "READY";
  const hasBot = !!bot;
  const humanPlayerCount = players.filter((p) => !p.isBot).length;
  const max = maxPlayers ?? 2;

  const canStartGame =
    isLobby && ((hasBot && humanPlayerCount >= 1) || players.length >= max);

  return { isLobby, hasBot, humanPlayerCount, canStartGame };
}

export function getRoomStatusMessage(params: {
  isConnected: boolean;
  winner: string | null;
  myRole: string | null;
  isDraw: boolean;
  isGameInProgress: boolean;
  isMyTurn: boolean;
  currentTurn: string | null;
  botRole?: string | null;
  canStartGame: boolean;
  hasBot: boolean;
  humanPlayerCount: number;
  playersLength: number;
  maxPlayers?: number;
  myTurnText: string;
}): StatusMessage {
  const {
    isConnected,
    winner,
    myRole,
    isDraw,
    isGameInProgress,
    isMyTurn,
    currentTurn,
    botRole,
    canStartGame,
    hasBot,
    humanPlayerCount,
    playersLength,
    maxPlayers,
    myTurnText,
  } = params;

  if (!isConnected) return { text: "Connecting...", color: "text-white/50" };

  if (winner) {
    const didIWin = winner === myRole;
    const botWon = botRole === winner;
    if (didIWin) return { text: "🎉 You Win!", color: "text-emerald-300" };
    if (botWon) return { text: "🤖 Bot Wins!", color: "text-cyan-300" };
    return { text: `😔 ${winner} Wins`, color: "text-red-300" };
  }

  if (isDraw) return { text: "🤝 It's a Draw!", color: "text-amber-300" };

  if (isGameInProgress) {
    const isBotTurn = botRole === currentTurn;
    if (isMyTurn) return { text: myTurnText, color: "text-emerald-300" };
    if (isBotTurn) return { text: "🤖 Bot is thinking...", color: "text-cyan-300" };
    return { text: "⏳ Opponent's turn...", color: "text-white/60" };
  }

  if (canStartGame) return { text: "✓ Ready to play! Click Start.", color: "text-emerald-300" };

  const max = maxPlayers ?? 2;
  return {
    text: hasBot
      ? `Waiting for you to join (${humanPlayerCount}/1)`
      : `Waiting for players (${playersLength}/${max})`,
    color: "text-white/50",
  };
}
