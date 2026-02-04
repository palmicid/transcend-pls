/**
 * @file app/play/tic-tac-toe/actions.ts
 * @description Consolidated server actions for Tic-Tac-Toe game and lobby management.
 */

"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/auth-session";
import { roomManager, Room, loadAndValidateRoom } from "@/lib/rooms";
import { broadcaster } from "@/lib/broadcast";
import TicTacToeGame from "./lib/TicTacToeGame";

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
}

/** Snapshot structure returned by TicTacToeGame */
export interface TicTacToeSnapshot {
  board: (string | null)[];
  currentTurn: string;
  winner: string | null;
  is_draw: boolean;
  players: Record<string, string | null>;
}

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

async function syncRoomToDb(roomId: string, room: Room) {
  const snapshot = room.getSnapshot() as TicTacToeSnapshot | null;
  if (!snapshot) return;

  await prisma.room.update({
    where: { id: roomId },
    data: {
      status: room.status,
      board_state: snapshot.board,
      current_turn: snapshot.winner ? null : snapshot.currentTurn,
      winner_role: snapshot.winner,
    },
  });
}

function attachBotMoveCallback(roomId: string, room: Room): void {
  const game: any = room.game;
  if (!game || typeof game.onBotMove === "undefined") return;

  game.onBotMove = async () => {
    const ended = typeof game.checkEndConditions === "function" ? game.checkEndConditions() : false;

    if (ended && room.status !== "ENDED") {
      room.end();
    }

    await syncRoomToDb(roomId, room);
    await broadcastRoomSnapshot(roomId, ended ? "game_end" : "game_move");
  };
}

/**
 * Broadcast full Prisma snapshot to all room subscribers.
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

  const players = room.players.map((p) => ({
    userId: p.user_id,
    displayName: p.user.display_name,
    role: p.role,
    isConnected: true,
    isBot: false,
  }));

  if (room.bot_role && room.bot_difficulty) {
    players.push({
      userId: -1,
      displayName: `Bot (${room.bot_difficulty === 1 ? "Easy" : room.bot_difficulty === 3 ? "Medium" : "Hard"})`,
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
      bot: room.bot_role
        ? {
            role: room.bot_role,
            difficulty: room.bot_difficulty,
            delayMs: room.bot_delay_ms ?? 500,
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
  };
}

// =============================================================================
// GAME ACTIONS
// =============================================================================

export async function createTicTacToeRoom(roomId?: string, ownerId?: string) {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "Unauthorized" };
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return { ok: false, error: "User not found" };
  }

  try {
    // Generate roomId if not provided
    const generatedRoomId = roomId || `room-${Math.random().toString(36).substring(2, 9)}`;

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
    roomManager.attachGame(room.id, game, broadcaster, session.userId.toString());

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

    attachBotMoveCallback(roomId, room);

    const success = room.submitAction(session.userId.toString(), { cell });

    if (success) {
      await syncRoomToDb(roomId, room);
      // Broadcast updated state from Prisma
      await broadcastRoomSnapshot(roomId, "game_move");
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
    return { ok: false };
  }

  try {
    const room = await loadAndValidateRoom(roomId);
    if (!room) return { ok: false };

    attachBotMoveCallback(roomId, room);

    const started = room.start();

    if (started) {
      await prisma.room.update({
        where: { id: roomId },
        data: { status: "IN_GAME" },
      });
      // Broadcast game start from Prisma
      await broadcastRoomSnapshot(roomId, "game_start");
    }

    return { ok: started };
  } catch (error) {
    console.error("Failed to start game:", error);
    return { ok: false };
  }
}

/**
 * Configure a bot for a player slot in Tic-Tac-Toe.
 */
export async function setBotForSlot(params: {
  roomId: string;
  role: "X" | "O";
  difficulty: 1 | 3 | 9;
}) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const { roomId, role, difficulty } = params;

  // Verify room ownership
  const room = roomManager.getRoom(roomId);
  if (!room) return { error: "Room not found" };

  const roomDb = await prisma.room.findUnique({ where: { id: roomId } });
  if (!roomDb || roomDb.owner_id !== session.userId) {
    return { error: "Only room owner can add bots" };
  }

  // Update room state in memory
  const game = room.game as any; // Cast to access configureBot
  if (typeof game.configureBot === 'function') {
    game.configureBot(role, difficulty);
  }

  // Update DB persistence
  await prisma.room.update({
    where: { id: roomId },
    data: {
      bot_role: role,
      bot_difficulty: difficulty,
      bot_delay_ms: 500,
    },
  });

    // Broadcast full snapshot update
    await broadcastRoomSnapshot(roomId, "config_change");

  return { ok: true };
}

/**
 * Remove bot from any slot in the room.
 */
export async function removeBotFromSlot(roomId: string) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  // Verify room ownership
  const room = roomManager.getRoom(roomId);
  if (!room) return { error: "Room not found" };

  const roomDb = await prisma.room.findUnique({ where: { id: roomId } });
  if (!roomDb || roomDb.owner_id !== session.userId) {
    return { error: "Only room owner can manage bots" };
  }

  // Update room state in memory
  const game = room.game as any;
  if (typeof game.configureBot === 'function') {
    game.configureBot(null); // Remove bot
  }

  // Update DB persistence
  await prisma.room.update({
    where: { id: roomId },
    data: {
      bot_role: null,
      bot_difficulty: null,
    },
  });

    // Broadcast full snapshot update
    await broadcastRoomSnapshot(roomId, "config_change");

  return { ok: true };
}

/**
 * Switch the current player to a different slot in the room.
 */
export async function switchToSlot(params: {
  roomId: string;
  targetRole: "X" | "O";
}) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const { roomId, targetRole } = params;

  // 1. Load room
  const room = await loadAndValidateRoom(roomId);
  if (!room) return { error: "Room not found" };

  // 2. Security: Validate game status (cannot switch during/after game)
  if (room.status !== "OPEN" && room.status !== "READY") {
    return { error: "Cannot switch spots once game has started" };
  }

  // 3. Update in-memory playerslot
  const game = room.game as any;
  const playerslot = game.playerslot;
  const success = playerslot.switchTo(session.userId.toString(), targetRole);

  if (!success) {
    return { error: "Slot not available or already occupied" };
  }

  // 4. Update DB persistence
  await prisma.roomPlayer.update({
    where: {
      room_id_user_id: {
        room_id: roomId,
        user_id: session.userId,
      },
    },
    data: { role: targetRole },
  });

  // 5. Broadcast update
  await broadcastRoomSnapshot(roomId, "player_switched");

  return { ok: true };
}
