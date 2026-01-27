/**
 * @file app/api/room/[id]/route.ts
 * @description Room operations - GET (join), DELETE (owner only).
 *
 * GET: Join a room and get SSE token for realtime connection.
 * DELETE: Remove a room (owner only).
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/auth-session";
import { generateSSEToken } from "@/lib/auth/sse-token";
import { roomManager } from "@/lib/rooms";
import { broadcaster } from "@/lib/broadcast";
import TicTacToeGame from "@/app/play/tic-tac-toe/lib/TicTacToeGame";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/room/:id - Join a room
 *
 * Adds the user to the room and returns SSE connection token.
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: roomId } = await context.params;

    // Find room with players
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        players: true,
        owner: {
          select: { id: true, display_name: true },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const existingPlayer = room.players.find(
      (p: { user_id: number; role: string | null }) => p.user_id === session.userId
    );
    if (!existingPlayer && room.players.length >= room.max_players) {
      return NextResponse.json({ error: "Room is full" }, { status: 403 });
    }

    // Add player if not already in
    let playerRole: string | null = null;
    if (!existingPlayer) {
      if (room.game_type === "tic-tac-toe") {
        const hasX = room.players.some((p: { role: string | null }) => p.role === "X");
        playerRole = hasX ? "O" : "X";
      } else {
        playerRole = `player${room.players.length + 1}`;
      }

      await prisma.roomPlayer.create({
        data: {
          room_id: room.id,
          user_id: session.userId,
          role: playerRole,
        },
      });

      // Update room status if now ready
      if (room.players.length + 1 >= room.max_players) {
        await prisma.room.update({
          where: { id: roomId },
          data: { status: "READY" },
        });
      }
    } else {
      playerRole = existingPlayer.role;
    }

    // Sync with in-memory room manager for SSE
    const inMemoryRoom = roomManager.ensureRoom(roomId, broadcaster);
    if (!inMemoryRoom.gameType) {
      const game = new TicTacToeGame();
      game.init();
      roomManager.attachGame(roomId, game, broadcaster, room.owner_id.toString());
    }
    roomManager.addPlayer(roomId, session.userId.toString());

    // Generate SSE token
    const sseToken = await generateSSEToken(room.id, session.userId);

    return NextResponse.json({
      room: {
        id: room.id,
        name: room.name,
        game_type: room.game_type,
        status: room.status,
        owner: room.owner,
        players: room.players.map((p: { user_id: number; role: string | null }) => ({
          user_id: p.user_id,
          role: p.role,
        })),
        board_state: room.board_state,
        current_turn: room.current_turn,
      },
      myRole: playerRole,
      sseToken,
    });
  } catch (error) {
    console.error("Failed to join room:", error);
    return NextResponse.json(
      { error: "Failed to join room" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/room/:id - Delete a room (owner only)
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: roomId } = await context.params;

    // Find room
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check ownership
    if (room.owner_id !== session.userId) {
      return NextResponse.json({ error: "Not room owner" }, { status: 403 });
    }

    // Delete from database (cascade deletes RoomPlayer entries)
    await prisma.room.delete({
      where: { id: roomId },
    });

    // Clean up in-memory room
    roomManager.destroyRoom(roomId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete room:", error);
    return NextResponse.json(
      { error: "Failed to delete room" },
      { status: 500 }
    );
  }
}
