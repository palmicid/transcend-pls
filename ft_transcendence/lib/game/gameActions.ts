/**
 * @file lib/game/gameActions.ts
 * @description Unified game actions using GameRegistry for validation.
 */

"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/auth-session";
import { roomManager, loadAndValidateRoom, Room } from "@/lib/rooms";
import { broadcaster } from "@/lib/broadcast";
import { GameRegistry } from "@/lib/game/GameRegistry";

// =============================================================================
// SYNC UTILITIES
// =============================================================================

async function syncRoomToDb(roomId: string, room: Room, gameId: string): Promise<void> {
  const snapshot = room.getSnapshot() as any;
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

async function broadcastRoomSnapshot(roomId: string, event: string, gameId: string): Promise<void> {
  const gameDef = GameRegistry.getOrThrow(gameId);

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      players: {
        include: { user: { select: { id: true, display_name: true } } },
      },
    },
  });

  if (!room) return;

  const board = gameDef.parseBoard(room.board_state);
  const isDraw = gameDef.checkDraw(board, room.winner_role);

  broadcaster.broadcast(
    roomId,
    JSON.stringify({
      event,
      roomId: room.id,
      gameType: room.game_type,
      status: room.status,
      board,
      currentTurn: room.current_turn,
      winner: room.winner_role,
      isDraw,
      players: room.players.map((p: any) => ({
        userId: p.user_id,
        displayName: p.user.display_name,
        role: p.role,
        isConnected: true,
      })),
      maxPlayers: room.max_players,
    })
  );
}

// =============================================================================
// PUBLIC ACTIONS
// =============================================================================

/**
 * Create a new game room.
 */
export async function createGameRoom(gameId: string): Promise<{ ok: boolean; roomId?: string; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  const gameDef = GameRegistry.get(gameId);
  if (!gameDef) return { ok: false, error: "Unknown game type" };

  try {
    const roomId = `room-${Math.random().toString(36).substring(2, 9)}`;

    const room = await prisma.room.create({
      data: {
        id: roomId,
        game_type: gameId,
        owner_id: session.userId,
        max_players: gameDef.maxPlayers,
        status: "OPEN",
        board_state: gameDef.createEmptyBoard() as any,
        current_turn: gameDef.firstTurn,
      },
    });

    const game = gameDef.createGame();
    game.init();
    roomManager.attachGame(room.id, game, broadcaster, session.userId.toString());

    return { ok: true, roomId: room.id };
  } catch (error) {
    console.error("Create room failed:", error);
    return { ok: false, error: "Failed to create room" };
  }
}

/**
 * Submit a game move.
 */
export async function submitGameMove(
  roomId: string,
  action: unknown,
  gameId: string
): Promise<{ ok: boolean; error?: string; snapshot: unknown }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Unauthorized", snapshot: null };

  const gameDef = GameRegistry.get(gameId);
  if (!gameDef) return { ok: false, error: "Unknown game", snapshot: null };

  try {
    const room = await loadAndValidateRoom(roomId);
    if (!room) return { ok: false, error: "Room not found", snapshot: null };

    // Get current state from DB for validation
    const dbRoom = await prisma.room.findUnique({ where: { id: roomId } });
    if (!dbRoom) return { ok: false, error: "Room not found", snapshot: null };

    // Get player's role
    const player = await prisma.roomPlayer.findUnique({
      where: { room_id_user_id: { room_id: roomId, user_id: session.userId } },
    });
    if (!player?.role) return { ok: false, error: "Not in room", snapshot: null };

    // Validate action using registry
    const board = gameDef.parseBoard(dbRoom.board_state);
    const validation = gameDef.validateAction(
      board,
      action,
      player.role,
      dbRoom.current_turn || gameDef.firstTurn
    );

    if (!validation.valid) {
      return { ok: false, error: validation.error, snapshot: null };
    }

    // Submit to in-memory room
    const success = room.submitAction(session.userId.toString(), action);

    if (success) {
      // Check win/draw using registry
      const newSnapshot = room.getSnapshot() as any;
      const newBoard = gameDef.parseBoard(newSnapshot.board);
      const winner = gameDef.checkWin(newBoard);
      const isDraw = gameDef.checkDraw(newBoard, winner);

      // Update DB with winner/draw status
      await prisma.room.update({
        where: { id: roomId },
        data: {
          status: winner || isDraw ? "ENDED" : "IN_GAME",
          board_state: newSnapshot.board,
          current_turn: winner ? null : newSnapshot.currentTurn,
          winner_role: winner,
        },
      });

      await broadcastRoomSnapshot(roomId, "game_move", gameId);
    }

    return { ok: success, snapshot: room.getSnapshot() };
  } catch (error) {
    console.error("Submit move failed:", error);
    return { ok: false, error: "Server error", snapshot: null };
  }
}

/**
 * Start a game (READY → IN_GAME).
 */
export async function startGame(roomId: string, gameId: string): Promise<{ ok: boolean }> {
  const session = await getSession();
  if (!session) return { ok: false };

  try {
    const room = await loadAndValidateRoom(roomId);
    if (!room) return { ok: false };

    const started = room.start();

    if (started) {
      await prisma.room.update({
        where: { id: roomId },
        data: { status: "IN_GAME" },
      });
      await broadcastRoomSnapshot(roomId, "game_start", gameId);
    }

    return { ok: started };
  } catch (error) {
    console.error("Start game failed:", error);
    return { ok: false };
  }
}
