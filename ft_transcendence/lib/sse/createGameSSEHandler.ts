/**
 * @file lib/sse/createGameSSEHandler.ts
 * @description Factory for creating game-specific SSE route handlers.
 *
 * Design Patterns:
 * - Factory Pattern: Creates configured handlers
 * - Template Method: Common flow with game-specific hooks
 * - Dependency Injection: GameDefinition provides behavior
 *
 * Security:
 * - All requests validated via session
 * - Room existence verified before joining
 * - Roles assigned server-side only
 */

import { NextRequest, NextResponse } from "next/server";
import { createSSEHandler } from "@/lib/sse/createSSEHandler";
import { getSession } from "@/lib/auth/auth-session";
import { loadAndValidateRoomSafe } from "@/lib/rooms";
import { broadcaster } from "@/lib/broadcast";
import prisma from "@/lib/prisma";
import { GameRegistry } from "@/lib/game/GameRegistry";
import { RoomSnapshot, PlayerInfo } from "@/types/game";
import { getTotalPlayerCount } from "@/lib/bot/botHelpers";

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createGameSSERouteHandler(gameId: string) {
  const gameDef = GameRegistry.getOrThrow(gameId);

  // -------------------------------------------------------------------------
  // HELPER: Build snapshot from Prisma room
  // -------------------------------------------------------------------------
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

    const board = gameDef.parseBoard(room.board_state);
    const isDraw = gameDef.checkDraw(board, room.winner_role);

    // Map human players
    const players: PlayerInfo[] = room.players.map((p: any): PlayerInfo => ({
      userId: p.user_id,
      displayName: p.user.display_name,
      role: p.role,
      isConnected: true,
      isBot: false,
    }));

    // Add bot as a virtual player if configured
    if (room.bot_role && room.bot_difficulty) {
      players.push({
        userId: -1,
        displayName: `Bot (${room.bot_difficulty === 1 ? 'Easy' : room.bot_difficulty === 3 ? 'Medium' : 'Hard'})`,
        role: room.bot_role,
        isConnected: true,
        isBot: true,
      });
    }

    return {
      roomId: room.id,
      gameType: room.game_type,
      status: room.status as any,
      board,
      currentTurn: room.current_turn,
      winner: room.winner_role,
      isDraw,
      players,
      maxPlayers: room.max_players,
      bot: room.bot_role ? {
        role: room.bot_role,
        difficulty: room.bot_difficulty,
        delayMs: room.bot_delay_ms ?? 500,
      } : null,
    };
  }

  // -------------------------------------------------------------------------
  // HELPER: Broadcast to all room subscribers
  // -------------------------------------------------------------------------
  async function broadcastSnapshot(roomId: string, event: string) {
    const snapshot = await getRoomSnapshot(roomId);
    if (!snapshot) return;
    broadcaster.broadcast(roomId, JSON.stringify({ event, ...snapshot }));
  }

  // -------------------------------------------------------------------------
  // HELPER: Add player to room
  // Algorithm: First-come-first-served role assignment
  // Security: Server controls role, not client
  // -------------------------------------------------------------------------
  async function addPlayerToRoom(roomId: string, userId: number): Promise<string | null> {
    // Check existing membership
    const existing = await prisma.roomPlayer.findUnique({
      where: { room_id_user_id: { room_id: roomId, user_id: userId } },
    });
    if (existing) return existing.role;

    // Check capacity
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { players: true },
    });
    if (!room) return null;

    const currentPlayers = getTotalPlayerCount(
      room.players.length,
      room.bot_role,
      room.bot_difficulty
    );
    if (currentPlayers >= room.max_players) return null;

    // Assign role (first available from gameDef.roles)
    const takenRoles = new Set(room.players.map((p: any) => p.role));
    if (room.bot_role && room.bot_difficulty) {
      takenRoles.add(room.bot_role);
    }
    const role = gameDef.roles.find(r => !takenRoles.has(r));
    if (!role) return null;

    await prisma.roomPlayer.create({
      data: { room_id: roomId, user_id: userId, role },
    });

    // Transition to READY when full
    const totalPlayers = getTotalPlayerCount(
      room.players.length + 1,
      room.bot_role,
      room.bot_difficulty
    );
    if (totalPlayers >= room.max_players) {
      await prisma.room.update({
        where: { id: roomId },
        data: { status: "READY" },
      });
    }

    return role;
  }

  // -------------------------------------------------------------------------
  // HELPER: Remove player from room
  // -------------------------------------------------------------------------
  async function removePlayer(roomId: string, userId: number): Promise<void> {
    try {
      await prisma.roomPlayer.deleteMany({
        where: { room_id: roomId, user_id: userId },
      });

      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: { players: true },
      });

      // Revert to OPEN if was READY and now below capacity
      if (room && room.players.length < room.max_players && room.status === "READY") {
        await prisma.room.update({
          where: { id: roomId },
          data: { status: "OPEN" },
        });
      }
    } catch (error) {
      console.error("[SSE] Remove player error:", error);
    }
  }

  // -------------------------------------------------------------------------
  // ROUTE HANDLER
  // -------------------------------------------------------------------------
  return async function GET(
    request: NextRequest,
    paramsObj: { params: Promise<{ roomId: string }> }
  ) {
    const { params } = paramsObj;
    const { roomId } = await params;

    // Security: Validate session
    const session = await getSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Security: Validate room exists
    const room = await loadAndValidateRoomSafe(roomId);
    if (!room) {
      return new NextResponse("Room not found", { status: 404 });
    }

    // Add player
    const role = await addPlayerToRoom(roomId, session.userId);
    if (role) {
      try {
        room.addPlayer(session.userId.toString());
      } catch (error) {
        await removePlayer(roomId, session.userId);
        throw error;
      }
    }

    return createSSEHandler({
      onInit: async (send) => {
        const snapshot = await getRoomSnapshot(roomId);
        if (snapshot) {
          send({ event: "snapshot", data: { ...snapshot, myRole: role } });
        }
        await broadcastSnapshot(roomId, "player_joined");
      },
      onSubscribe: (send) => {
        const listener = (data: string) => send({ data });
        room.subscribe(listener);
        return () => room.unsubscribe(listener);
      },
      onCleanup: async () => {
        await removePlayer(roomId, session.userId);
        room.removePlayer(session.userId.toString());
        await broadcastSnapshot(roomId, "player_left");
      },
    });
  };
}
