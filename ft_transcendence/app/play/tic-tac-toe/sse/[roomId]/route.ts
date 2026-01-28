/**
 * @file app/play/tic-tac-toe/sse/[roomId]/route.ts
 * @description SSE endpoint for real-time game updates.
 *
 * Flow:
 * 1. Client connects with session cookie
 * 2. Add player to Prisma → Broadcast snapshot
 * 3. Subscribe to room events
 * 4. On disconnect: Remove player from Prisma → Broadcast snapshot
 */

import { NextRequest, NextResponse } from "next/server";
import { createSSEHandler } from "@/lib/sse/createSSEHandler";
import { getSession } from "@/lib/auth/auth-session";
import { roomManager } from "@/lib/rooms";
import { broadcaster } from "@/lib/broadcast";
import prisma from "@/lib/prisma";
import TicTacToeGame from "../../lib/TicTacToeGame";

// =============================================================================
// TYPES
// =============================================================================

export interface PlayerInfo {
  userId: number;
  displayName: string;
  role: string | null;
  isConnected: boolean;
}

export interface RoomSnapshot {
  roomId: string;
  status: string;
  board: (string | null)[];
  currentTurn: string | null;
  winner: string | null;
  isDraw: boolean;
  players: PlayerInfo[];
  maxPlayers: number;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Fetch full room state from Prisma and format as snapshot.
 */
async function getRoomSnapshot(roomId: string): Promise<RoomSnapshot | null> {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      players: {
        include: {
          user: { select: { id: true, display_name: true } },
        },
      },
    },
  });

  if (!room) return null;

  const board = (room.board_state as (string | null)[]) || Array(9).fill(null);
  const isDraw = !room.winner_role && board.every((c) => c !== null);

  return {
    roomId: room.id,
    status: room.status,
    board,
    currentTurn: room.current_turn,
    winner: room.winner_role,
    isDraw,
    players: room.players.map((p) => ({
      userId: p.user_id,
      displayName: p.user.display_name,
      role: p.role,
      isConnected: true, // All players in DB are connected via SSE
    })),
    maxPlayers: room.max_players,
  };
}

/**
 * Broadcast room snapshot to all subscribers.
 */
async function broadcastRoomSnapshot(roomId: string, event: string) {
  const snapshot = await getRoomSnapshot(roomId);
  if (!snapshot) return;

  broadcaster.broadcast(
    roomId,
    JSON.stringify({ event, ...snapshot })
  );
}

/**
 * Ensure room is loaded in memory, hydrating from DB if necessary.
 * Restores player slots from Prisma data.
 */
async function getOrLoadRoom(roomId: string) {
  let room = roomManager.getRoom(roomId);
  if (room) return room;

  // Load room WITH players from Prisma
  const dbRoom = await prisma.room.findUnique({
    where: { id: roomId },
    include: { players: true },
  });

  if (!dbRoom) return null;

  const game = new TicTacToeGame();
  game.init();
  game.restoreState(dbRoom);

  // Restore player slots from Prisma data
  for (const player of dbRoom.players) {
    if (player.role === "X" || player.role === "O") {
      game.playerslot.roles[player.role] = player.user_id.toString();
    }
  }

  room = roomManager.attachGame(
    dbRoom.id,
    game,
    broadcaster,
    dbRoom.owner_id.toString()
  );

  return room;
}

/**
 * Add player to room in Prisma.
 * Returns the player's role (X or O).
 */
async function addPlayerToRoom(roomId: string, userId: number): Promise<string | null> {
  const existingPlayer = await prisma.roomPlayer.findUnique({
    where: {
      room_id_user_id: { room_id: roomId, user_id: userId },
    },
  });

  if (existingPlayer) {
    return existingPlayer.role;
  }

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { players: true },
  });

  if (!room) return null;
  if (room.players.length >= room.max_players) return null;

  const hasX = room.players.some((p) => p.role === "X");
  const role = hasX ? "O" : "X";

  await prisma.roomPlayer.create({
    data: { room_id: roomId, user_id: userId, role },
  });

  // Update room status if now full
  if (room.players.length + 1 >= room.max_players) {
    await prisma.room.update({
      where: { id: roomId },
      data: { status: "READY" },
    });
  }

  return role;
}

/**
 * Remove player from room in Prisma.
 */
async function removePlayerFromRoom(roomId: string, userId: number): Promise<void> {
  try {
    // Use deleteMany to avoid error if player already removed
    await prisma.roomPlayer.deleteMany({
      where: { room_id: roomId, user_id: userId },
    });

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { players: true },
    });

    if (room && room.players.length < room.max_players && room.status === "READY") {
      await prisma.room.update({
        where: { id: roomId },
        data: { status: "OPEN" },
      });
    }
  } catch (error) {
    console.error("[SSE] Failed to remove player:", error);
  }
}

// =============================================================================
// ROUTE HANDLER
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;

  const session = await getSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const userId = session.userId;

  const room = await getOrLoadRoom(roomId);
  if (!room) {
    return new NextResponse("Room not found", { status: 404 });
  }

  // Add player to Prisma and in-memory
  const role = await addPlayerToRoom(roomId, userId);
  if (role) {
    try {
      room.addPlayer(userId.toString());
    } catch (error) {
      // Roll back Prisma change if in-memory update fails
      try {
        await removePlayerFromRoom(roomId, userId);
      } catch {
        // Swallow rollback errors to avoid masking the original failure
      }
      throw error;
    }
  }

  return createSSEHandler({
    onInit: async (send) => {
      // Send initial snapshot from Prisma
      const snapshot = await getRoomSnapshot(roomId);
      if (snapshot) {
        send({
          event: "snapshot",
          data: { ...snapshot, myRole: role },
        });
      }

      // Broadcast player_joined to all
      await broadcastRoomSnapshot(roomId, "player_joined");
    },
    onSubscribe: (send) => {
      const listener = (data: string) => {
        send({ data });
      };
      room.subscribe(listener);
      return () => room.unsubscribe(listener);
    },
    onCleanup: async () => {
      await removePlayerFromRoom(roomId, userId);
      room.removePlayer(userId.toString());
      await broadcastRoomSnapshot(roomId, "player_left");
    },
  });
}
