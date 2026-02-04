/**
 * @file app/play/tic-tac-toe/sse/[roomId]/route.ts
 */

import { createGameSSERouteHandler } from "@/lib/sse/createGameSSEHandler";

import { NextRequest, NextResponse } from "next/server";
import { createSSEHandler } from "@/lib/sse/createSSEHandler";
import { getSession } from "@/lib/auth/auth-session";
import { loadAndValidateRoomSafe } from "@/lib/rooms";
import { broadcaster } from "@/lib/broadcast";
import prisma from "@/lib/prisma";
import { getTotalPlayerCount } from "@/app/play/tic-tac-toe/lib/BotHelpers";

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
 * Includes validation of loaded state for consistency.
 */
async function getOrLoadRoom(roomId: string) {
  return await loadAndValidateRoomSafe(roomId);
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

  // Check if room is full, accounting for bot as a player
  const currentPlayers = getTotalPlayerCount(room.players.length, room.bot_role, room.bot_difficulty);
  if (currentPlayers >= room.max_players) return null;

  const hasX = room.players.some((p) => p.role === "X");
  const role = hasX ? "O" : "X";

  await prisma.roomPlayer.create({
    data: { room_id: roomId, user_id: userId, role },
  });

  // Update room status if now full
  // Account for bot - if bot is configured, it counts as a player
  const totalPlayers = getTotalPlayerCount(room.players.length + 1, room.bot_role, room.bot_difficulty);
  if (totalPlayers >= room.max_players) {
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
