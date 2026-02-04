/**
 * @file app/play/connect4/actions.ts
 */

"use server";

import { createGameRoom, submitGameMove, startGame, broadcastRoomSnapshot } from "@/lib/game/gameActions";

// Bot Management Actions
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/auth-session";
import { roomManager } from "@/lib/rooms";
import { revalidatePath } from "next/cache";

export const createConnect4Room = async () => await createGameRoom("connect4");
export const submitConnect4Move = async (roomId: string, userId: string, column: number) =>
  await submitGameMove(roomId, { column }, "connect4");
export const startConnect4Game = async (roomId: string) => await startGame(roomId, "connect4");

/**
 * Configure a bot for a player slot in Connect 4.
 */
export async function setBotForSlot(params: {
  roomId: string;
  role: "Red" | "Yellow";
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
    },
  });

    // Broadcast full snapshot update
    await broadcastRoomSnapshot(roomId, "config_change", "connect4");

  revalidatePath(`/play/connect4/${roomId}`);
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
    await broadcastRoomSnapshot(roomId, "config_change", "connect4");

  revalidatePath(`/play/connect4/${roomId}`);
  return { ok: true };
}

/**
 * Switch the current player to a different slot in the room.
 */
export async function switchToSlot(params: {
  roomId: string;
  targetRole: "Red" | "Yellow";
}) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const { roomId, targetRole } = params;

  // 1. Load room
  const room = roomManager.getRoom(roomId);
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
  await broadcastRoomSnapshot(roomId, "player_switched", "connect4");

  revalidatePath(`/play/connect4/${roomId}`);
  return { ok: true };
}
