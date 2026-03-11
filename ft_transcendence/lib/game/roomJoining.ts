/**
 * @file lib/game/roomJoining.ts
 * @description Shared room joining logic with bot support.
 *
 * Bot support is opt-in via GameRegistry.supportsBots
 */

"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/auth-session";
import { GameRegistry } from "@/lib/game/GameRegistry";

const BOT_USER_ID = -1; // Special ID for bot players

// =============================================================================
// JOIN ROOM
// =============================================================================

export async function joinRoom(
  roomId: string,
  userId: number
): Promise<{ ok: boolean; role: string | null; error?: string }> {
  // Check existing membership
  const existing = await prisma.roomPlayer.findUnique({
    where: { room_id_user_id: { room_id: roomId, user_id: userId } },
  });
  if (existing) {
    return { ok: true, role: existing.role };
  }

  // Check capacity
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { players: true },
  });

  if (!room) return { ok: false, role: null, error: "Room not found" };

  const gameDef = GameRegistry.get(room.game_type);
  if (!gameDef) return { ok: false, role: null, error: "Unknown game type" };

  if (room.players.length >= room.max_players) {
    return { ok: false, role: null, error: "Room full" };
  }

  // Assign role
  const takenRoles = new Set(room.players.map((p: any) => p.role));
  const role = gameDef.roles.find(r => !takenRoles.has(r));
  if (!role) return { ok: false, role: null, error: "No roles available" };

  await prisma.roomPlayer.create({
    data: { room_id: roomId, user_id: userId, role },
  });

  // Update status if now full
  if (room.players.length + 1 >= room.max_players) {
    await prisma.room.update({
      where: { id: roomId },
      data: { status: "READY" },
    });
  }

  return { ok: true, role };
}

// =============================================================================
// ADD BOT (TTT ONLY)
// =============================================================================

export async function addBotToRoom(roomId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { players: true },
  });

  if (!room) return { ok: false, error: "Room not found" };

  const gameDef = GameRegistry.get(room.game_type);
  if (!gameDef) return { ok: false, error: "Unknown game type" };

  // Check if game supports bots
  if (!gameDef.supportsBots) {
    return { ok: false, error: `${gameDef.name} does not support bots` };
  }

  // Check if room owner
  if (room.owner_id !== session.userId) {
    return { ok: false, error: "Only room owner can add bots" };
  }

  // Check capacity
  if (room.players.length >= room.max_players) {
    return { ok: false, error: "Room full" };
  }

  // Assign bot role
  const takenRoles = new Set(room.players.map((p: any) => p.role));
  const role = gameDef.roles.find(r => !takenRoles.has(r));
  if (!role) return { ok: false, error: "No roles available" };

  // Create bot player
  await prisma.roomPlayer.create({
    data: {
      room_id: roomId,
      user_id: BOT_USER_ID,
      role,
    },
  });

  // Update status if now full
  if (room.players.length + 1 >= room.max_players) {
    await prisma.room.update({
      where: { id: roomId },
      data: { status: "READY" },
    });
  }

  return { ok: true };
}

// =============================================================================
// LEAVE ROOM
// =============================================================================

export async function leaveRoom(roomId: string): Promise<{ ok: boolean }> {
  const session = await getSession();
  if (!session) return { ok: false };

  await prisma.roomPlayer.deleteMany({
    where: { room_id: roomId, user_id: session.userId },
  });

  // Revert to OPEN if was READY
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

  return { ok: true };
}
