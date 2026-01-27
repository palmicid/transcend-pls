/**
 * @file app/play/tic-tac-toe/actions.ts
 * @description Consolidated server actions for Tic-Tac-Toe game and lobby management.
 */

"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/auth-session";
import { roomManager, Room } from "@/lib/rooms";
import { broadcaster } from "@/lib/broadcast";
import TicTacToeGame from "./lib/TicTacToeGame";

// =============================================================================
// TYPES
// =============================================================================

export interface RoomInfo {
  id: string;
  name: string | null;
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

async function getOrLoadRoom(roomId: string): Promise<Room | null> {
  let room = roomManager.getRoom(roomId);
  if (room) return room;

  const dbRoom = await prisma.room.findUnique({
    where: { id: roomId },
  });

  if (!dbRoom) return null;

  const game = new TicTacToeGame();
  game.init();
  game.restoreState(dbRoom);

  room = roomManager.attachGame(
    dbRoom.id,
    game,
    broadcaster,
    dbRoom.owner_id.toString()
  );

  return room;
}

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

// =============================================================================
// LOBBY ACTIONS
// =============================================================================

export async function listAllRooms(): Promise<RoomInfo[]> {
  const rooms = await prisma.room.findMany({
    where: { game_type: "tic-tac-toe" },
    select: {
      id: true,
      name: true,
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
    name: room.name,
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
    name: room.name,
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

  try {
    const room = await prisma.room.create({
      data: {
        name: roomId || null,
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

export async function joinTicTacToeRoom(roomId: string, playerId: string) {
  const session = await getSession();
  if (!session) {
    return { ok: false, state: null };
  }

  try {
    const room = await getOrLoadRoom(roomId);
    if (!room) {
      return { ok: false, state: null };
    }

    const ok = room.addPlayer(session.userId.toString());

    return { ok, state: room.status };
  } catch (error) {
    console.error("Failed to join room:", error);
    return { ok: false, state: null };
  }
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
    const room = await getOrLoadRoom(roomId);
    if (!room) {
      return { ok: false, snapshot: null };
    }

    const success = room.submitAction(session.userId.toString(), { cell });

    if (success) {
      await syncRoomToDb(roomId, room);
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
    const room = await getOrLoadRoom(roomId);
    if (!room) return { ok: false };

    const started = room.start();

    if (started) {
      await prisma.room.update({
        where: { id: roomId },
        data: { status: "IN_GAME" },
      });
    }

    return { ok: started };
  } catch (error) {
    console.error("Failed to start game:", error);
    return { ok: false };
  }
}
