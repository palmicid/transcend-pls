/**
 * @file app/play/tic-tac-toe/actions.ts
 * @description Consolidated server actions for Tic-Tac-Toe game and lobby management.
 *
 * Includes:
 * - Lobby actions (list, create, delete, leave rooms)
 * - Game actions (submit moves, start game)
 * - Bot management actions (set/remove bot from slots)
 */

"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/auth-session";
import { roomManager, Room, loadAndValidateRoom } from "@/lib/rooms";
import { broadcaster } from "@/lib/broadcast";
import TicTacToeGame from "./lib/TicTacToeGame";
import { type BotDifficulty } from "./lib/TicTacToeBot";

// =============================================================================
// TYPES
// =============================================================================

export interface RoomInfo {
  id: string;
  game_type: string;
  status: string;
  owner: { id: number; display_name: string } | null;
  playerCount: number;
  max_players: number;
  hasBot?: boolean;
}

/** Snapshot structure returned by TicTacToeGame */
export interface TicTacToeSnapshot {
  board: (string | null)[];
  currentTurn: string;
  winner: string | null;
  is_draw: boolean;
  players: Record<string, string | null>;
  bot?: {
    role: string | null;
    difficulty: number | null;
    delayMs: number;
  } | null;
}

/** Options for configuring a bot in a slot */
export interface SetBotOptions {
  roomId: string;
  role: "X" | "O";
  difficulty: BotDifficulty;
  delayMs?: number;
}

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

async function syncRoomToDb(roomId: string, room: Room) {
  const snapshot = room.getSnapshot() as TicTacToeSnapshot | null;
  if (!snapshot) return;

  // Get bot config from game
  const game = room.game as TicTacToeGame;
  const botConfig = game.gameConfig.toPrisma();

  await prisma.room.update({
    where: { id: roomId },
    data: {
      status: room.status,
      board_state: snapshot.board,
      current_turn: snapshot.winner ? null : snapshot.currentTurn,
      winner_role: snapshot.winner,
      // Sync bot config
      ...botConfig,
    },
  });
}

/**
 * Broadcast full Prisma snapshot to all room subscribers.
 * Includes bot as a "virtual player" in the players list.
 */
async function broadcastRoomSnapshot(roomId: string, event: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      players: {
        include: { user: { select: { id: true, display_name: true } } },
      },
    },
  });

  if (!room) return;

  const board = (room.board_state as (string | null)[]) || Array(9).fill(null);
  const isDraw = !room.winner_role && board.every((c) => c !== null);

  // Build players list from human players
  const players: Array<{
    userId: number;
    displayName: string;
    role: string;
    isConnected: boolean;
    isBot: boolean;
  }> = room.players.map((p) => ({
    userId: p.user_id,
    displayName: p.user.display_name,
    role: p.role,
    isConnected: true,
    isBot: false,
  }));

  // Add bot as a "virtual player" if configured
  if (room.bot_role) {
    const difficultyLabel =
      room.bot_difficulty === 1
        ? "Easy"
        : room.bot_difficulty === 3
        ? "Medium"
        : "Hard";

    players.push({
      userId: -1, // Virtual ID for bot
      displayName: `Bot (${difficultyLabel})`,
      role: room.bot_role,
      isConnected: true,
      isBot: true,
    });
  }

  broadcaster.broadcast(
    roomId,
    JSON.stringify({
      event,
      roomId: room.id,
      status: room.status,
      board,
      currentTurn: room.current_turn,
      winner: room.winner_role,
      isDraw,
      players,
      maxPlayers: room.max_players,
      // Bot configuration for UI
      bot: room.bot_role
        ? {
            role: room.bot_role,
            difficulty: room.bot_difficulty,
            delayMs: room.bot_delay_ms,
          }
        : null,
    })
  );
}

// =============================================================================
// LOBBY ACTIONS
// =============================================================================

export async function listAllRooms(): Promise<RoomInfo[]> {
  const rooms = await prisma.room.findMany({
    where: { game_type: "tic-tac-toe" },
    select: {
      id: true,
      game_type: true,
      status: true,
      max_players: true,
      bot_role: true,
      owner: {
        select: { id: true, display_name: true },
      },
      players: {
        select: { user_id: true },
      },
    },
    orderBy: { created_at: "desc" },
  });

  return rooms.map((room) => ({
    id: room.id,
    game_type: room.game_type,
    status: room.status,
    owner: room.owner,
    playerCount: room.players.length,
    max_players: room.max_players,
    hasBot: !!room.bot_role,
  }));
}

export async function deleteLobbyRoom(
  roomId: string,
  requesterId: string
): Promise<{ ok: boolean }> {
  const session = await getSession();
  if (!session) {
    return { ok: false };
  }

  const room = await prisma.room.findUnique({
    where: { id: roomId },
  });

  if (!room || room.owner_id !== session.userId) {
    return { ok: false };
  }

  await prisma.room.delete({ where: { id: roomId } });
  roomManager.destroyRoom(roomId);

  return { ok: true };
}

export async function leaveLobbyRoom(
  roomId: string,
  playerId: string
): Promise<{ ok: boolean }> {
  const session = await getSession();
  if (!session) {
    return { ok: false };
  }

  await prisma.roomPlayer.deleteMany({
    where: {
      room_id: roomId,
      user_id: session.userId,
    },
  });

  roomManager.removePlayer(roomId, session.userId.toString());

  return { ok: true };
}

export async function getRoomMeta(roomId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      owner: { select: { id: true, display_name: true } },
      players: { select: { user_id: true, role: true } },
    },
  });

  if (!room) {
    return null;
  }

  return {
    id: room.id,
    game_type: room.game_type,
    status: room.status,
    owner: room.owner,
    players: room.players,
    board_state: room.board_state,
    current_turn: room.current_turn,
    bot_role: room.bot_role,
    bot_difficulty: room.bot_difficulty,
    bot_delay_ms: room.bot_delay_ms,
  };
}

// =============================================================================
// BOT MANAGEMENT ACTIONS
// =============================================================================

/**
 * Add a bot to an empty slot in the room.
 * The bot becomes "another player" occupying that role.
 *
 * @param options - Bot configuration options
 * @returns Success status and any error message
 */
export async function setBotForSlot(options: SetBotOptions) {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "Unauthorized" };
  }

  try {
    // Verify room exists
    const dbRoom = await prisma.room.findUnique({
      where: { id: options.roomId },
      include: { players: true },
    });

    if (!dbRoom) {
      return { ok: false, error: "Room not found" };
    }

    // Check if the slot is occupied by a human player
    const humanInSlot = dbRoom.players.find((p) => p.role === options.role);
    if (humanInSlot) {
      return { ok: false, error: "Slot is occupied by a human player" };
    }

    // Get room from memory or load from DB (this properly restores player slots)
    const room = await loadAndValidateRoom(options.roomId);
    if (!room) {
      return { ok: false, error: "Failed to load room" };
    }

    // Configure the bot in the game
    const game = room.game as TicTacToeGame;
    game.configureBot(options.role, options.difficulty, options.delayMs ?? 500);

    // Persist to database
    await prisma.room.update({
      where: { id: options.roomId },
      data: {
        bot_role: options.role,
        bot_difficulty: options.difficulty,
        bot_delay_ms: options.delayMs ?? 500,
      },
    });

    // Broadcast update
    await broadcastRoomSnapshot(options.roomId, "bot_configured");

    return { ok: true };
  } catch (error) {
    console.error("Failed to set bot:", error);
    return { ok: false, error: "Failed to configure bot" };
  }
}

/**
 * Remove the bot from a room (convert back to open slot).
 *
 * @param roomId - The room to remove the bot from
 * @returns Success status and any error message
 */
export async function removeBotFromSlot(roomId: string) {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "Unauthorized" };
  }

  try {
    const room = roomManager.getRoom(roomId);
    if (!room) {
      return { ok: false, error: "Room not found" };
    }

    // Remove bot from game
    const game = room.game as TicTacToeGame;
    game.configureBot(null, null);

    // Clear bot config in database
    await prisma.room.update({
      where: { id: roomId },
      data: {
        bot_role: null,
        bot_difficulty: null,
      },
    });

    // Broadcast update
    await broadcastRoomSnapshot(roomId, "bot_removed");

    return { ok: true };
  } catch (error) {
    console.error("Failed to remove bot:", error);
    return { ok: false, error: "Failed to remove bot" };
  }
}

// =============================================================================
// GAME ACTIONS
// =============================================================================

export async function createTicTacToeRoom(roomId?: string, ownerId?: string) {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "Unauthorized" };
  }

  try {
    // Generate roomId if not provided
    const generatedRoomId =
      roomId || `room-${Math.random().toString(36).substring(2, 9)}`;

    const room = await prisma.room.create({
      data: {
        id: generatedRoomId,
        game_type: "tic-tac-toe",
        owner_id: session.userId,
        max_players: 2,
        status: "OPEN",
        board_state: Array(9).fill(null),
        current_turn: "X",
      },
    });

    const game = new TicTacToeGame();
    game.init();
    roomManager.attachGame(
      room.id,
      game,
      broadcaster,
      session.userId.toString()
    );

    return { ok: true, roomId: room.id };
  } catch (error) {
    console.error("Failed to create room:", error);
    return { ok: false, error: "Failed to create room" };
  }
}

/**
 * @deprecated Joining now happens automatically via SSE connection.
 * This function is kept for backward compatibility.
 */
export async function joinTicTacToeRoom(roomId: string, playerId: string) {
  const session = await getSession();
  if (!session) {
    return { ok: false, state: null };
  }

  // Just verify room exists - actual joining happens via SSE
  const room = await prisma.room.findUnique({
    where: { id: roomId },
  });

  return { ok: !!room, state: room?.status ?? null };
}

export async function submitTicTacToeMove(
  roomId: string,
  playerId: string,
  cell: number
) {
  const session = await getSession();
  if (!session) {
    return { ok: false, snapshot: null };
  }

  try {
    const room = await loadAndValidateRoom(roomId);
    if (!room) {
      return { ok: false, snapshot: null };
    }

    const success = room.submitAction(session.userId.toString(), { cell });

    if (success) {
      await syncRoomToDb(roomId, room);
      // Broadcast updated state from Prisma
      await broadcastRoomSnapshot(roomId, "game_move");

      // Schedule bot's response if applicable
      const game = room.game as TicTacToeGame;
      game.onBotMove = async () => {
        await syncRoomToDb(roomId, room);
        await broadcastRoomSnapshot(roomId, "game_move");
      };
      game.scheduleBotMoveIfNeeded();
    }

    return { ok: success, snapshot: room.getSnapshot() };
  } catch (error) {
    console.error("Failed to submit move:", error);
    return { ok: false, snapshot: null };
  }
}

export async function startTicTacToeGame(roomId: string) {
  const session = await getSession();
  if (!session) {
    console.log("[startTicTacToeGame] No session");
    return { ok: false };
  }

  try {
    console.log("[startTicTacToeGame] Loading room:", roomId);
    const room = await loadAndValidateRoom(roomId);
    if (!room) {
      console.log("[startTicTacToeGame] Room not found");
      return { ok: false };
    }

    // Load bot config from DB if not already in game
    const dbRoom = await prisma.room.findUnique({
      where: { id: roomId },
    });

    console.log("[startTicTacToeGame] DB room bot config:", {
      bot_role: dbRoom?.bot_role,
      bot_difficulty: dbRoom?.bot_difficulty,
      bot_delay_ms: dbRoom?.bot_delay_ms,
    });

    if (dbRoom?.bot_role && dbRoom?.bot_difficulty) {
      const game = room.game as TicTacToeGame;
      console.log("[startTicTacToeGame] Game hasBot before configure:", game.gameConfig.hasBot);
      if (!game.gameConfig.hasBot) {
        console.log("[startTicTacToeGame] Configuring bot from DB");
        game.configureBot(
          dbRoom.bot_role as "X" | "O",
          dbRoom.bot_difficulty as BotDifficulty,
          dbRoom.bot_delay_ms
        );
      }
    }

    console.log("[startTicTacToeGame] Calling room.start()");
    const started = room.start();
    console.log("[startTicTacToeGame] room.start() returned:", started);

    if (started) {
      await prisma.room.update({
        where: { id: roomId },
        data: { status: "IN_GAME" },
      });

      // Broadcast game start from Prisma
      await broadcastRoomSnapshot(roomId, "game_start");

      // If bot plays first (is X), set up callback for bot move
      const game = room.game as TicTacToeGame;
      game.onBotMove = async () => {
        await syncRoomToDb(roomId, room);
        await broadcastRoomSnapshot(roomId, "game_move");
      };
      // Note: scheduleBotMoveIfNeeded is called in startGame()
    }

    return { ok: started };
  } catch (error) {
    console.error("Failed to start game:", error);
    return { ok: false };
  }
}
