import type { BotConfig, PlayerInfo, RoomSnapshot, RoomStatus } from "@/types/game";

export interface GameRoomSnapshot extends RoomSnapshot<unknown> {
  myRole?: string | null;
}

export interface ParsedGameSSEPayload {
  event: string | null;
  snapshot: GameRoomSnapshot | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parsePlayers(value: unknown): PlayerInfo[] | null {
  if (!Array.isArray(value)) return null;

  const parsed = value
    .filter(isRecord)
    .map((player): PlayerInfo | null => {
      if (typeof player.userId !== "number") return null;
      if (typeof player.displayName !== "string") return null;
      if (typeof player.isConnected !== "boolean") return null;

      const role =
        typeof player.role === "string" || player.role === null ? player.role : null;
      const isBot = typeof player.isBot === "boolean" ? player.isBot : undefined;

      return {
        userId: player.userId,
        displayName: player.displayName,
        role,
        isConnected: player.isConnected,
        isBot,
      };
    })
    .filter((player): player is PlayerInfo => player !== null);

  return parsed;
}

export function parseGameSSEPayload(rawData: string): ParsedGameSSEPayload | null {
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawData);
  } catch {
    return null;
  }

  if (!isRecord(parsedJson)) return null;

  const event = typeof parsedJson.event === "string" ? parsedJson.event : null;
  const snapshotSource = isRecord(parsedJson.snapshot) ? parsedJson.snapshot : parsedJson;

  const roomId =
    typeof snapshotSource.roomId === "string" ? snapshotSource.roomId : null;
  if (!roomId || snapshotSource.board === undefined) {
    return { event, snapshot: null };
  }

  const players = parsePlayers(snapshotSource.players) ?? [];

  const bot =
    isRecord(snapshotSource.bot) && typeof snapshotSource.bot.role === "string"
      ? ({
          role: snapshotSource.bot.role,
          difficulty:
            typeof snapshotSource.bot.difficulty === "number" ||
            snapshotSource.bot.difficulty === null
              ? snapshotSource.bot.difficulty
              : null,
          delayMs:
            typeof snapshotSource.bot.delayMs === "number"
              ? snapshotSource.bot.delayMs
              : 500,
        } as BotConfig)
      : null;

  const status =
    typeof snapshotSource.status === "string" ? snapshotSource.status : "OPEN";

  const snapshot: GameRoomSnapshot = {
    roomId,
    gameType:
      typeof snapshotSource.gameType === "string" ? snapshotSource.gameType : "unknown",
    status: status as RoomStatus,
    board: snapshotSource.board,
    currentTurn:
      typeof snapshotSource.currentTurn === "string" || snapshotSource.currentTurn === null
        ? snapshotSource.currentTurn
        : null,
    winner:
      typeof snapshotSource.winner === "string" || snapshotSource.winner === null
        ? snapshotSource.winner
        : null,
    isDraw:
      typeof snapshotSource.isDraw === "boolean"
        ? snapshotSource.isDraw
        : Boolean(snapshotSource.is_draw),
    players,
    maxPlayers:
      typeof snapshotSource.maxPlayers === "number" ? snapshotSource.maxPlayers : 2,
    bot,
    myRole:
      typeof snapshotSource.myRole === "string" || snapshotSource.myRole === null
        ? snapshotSource.myRole
        : null,
  };

  return { event, snapshot };
}
