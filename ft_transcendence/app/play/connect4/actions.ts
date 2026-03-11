/**
 * @file app/play/connect4/actions.ts
 * @description Server actions for Connect 4 game and lobby management.
 *
 * Bot and broadcast helpers are intentionally imported from the shared
 * lib/game/gameActions module — do NOT add private copies here.
 */

"use server";

import prisma from "@/lib/prisma";
import type { BotDifficulty } from "@/lib/bot/constants";
import { getSession } from "@/lib/auth/auth-session";
import { loadAndValidateRoom, roomManager } from "@/lib/rooms";
import {
	createGameRoom,
	submitGameMove,
	startGame,
	broadcastRoomSnapshot,
} from "@/lib/game/gameActions";
import { revalidatePath } from "next/cache";

// =============================================================================
// GENERIC ROOM ACTIONS (delegated to shared helpers)
// =============================================================================

export const createConnect4Room = async () => await createGameRoom("connect4");

export const submitConnect4Move = async (
	roomId: string,
	userId: string,
	column: number,
) => await submitGameMove(roomId, { column }, "connect4");

export const startConnect4Game = async (roomId: string) =>
	await startGame(roomId, "connect4");

// =============================================================================
// BOT ACTIONS
// =============================================================================

/**
 * Configure a bot for a player slot in Connect 4.
 * Uses loadAndValidateRoom so it works even after a server restart
 * (no longer relies on the in-memory roomManager.getRoom alone).
 */
export async function setBotForSlot(params: {
	roomId: string;
	role: "Red" | "Yellow";
	difficulty: BotDifficulty;
}) {
	const session = await getSession();
	if (!session) return { error: "Unauthorized" };

	const { roomId, role, difficulty } = params;

	// Verify room ownership against DB first
	const roomDb = await prisma.room.findUnique({ where: { id: roomId } });
	if (!roomDb) return { error: "Room not found" };
	if (roomDb.owner_id !== session.userId) {
		return { error: "Only room owner can add bots" };
	}

	// Load (or rehydrate) the in-memory room
	const room = await loadAndValidateRoom(roomId);
	if (!room) return { error: "Room not found in memory" };

	const updated = await roomManager.configureBot(roomId, {
		role,
		difficulty,
		delayMs: 500,
	});
	if (!updated) return { error: "Failed to configure bot" };

	await broadcastRoomSnapshot(roomId, "config_change", "connect4");

	revalidatePath(`/play/connect4/${roomId}`);
	return { ok: true };
}

/**
 * Remove the bot from the room.
 * Uses loadAndValidateRoom so it works even after a server restart.
 */
export async function removeBotFromSlot(roomId: string) {
	const session = await getSession();
	if (!session) return { error: "Unauthorized" };

	// Verify room ownership against DB first
	const roomDb = await prisma.room.findUnique({ where: { id: roomId } });
	if (!roomDb) return { error: "Room not found" };
	if (roomDb.owner_id !== session.userId) {
		return { error: "Only room owner can manage bots" };
	}

	// Load (or rehydrate) the in-memory room
	const room = await loadAndValidateRoom(roomId);
	if (!room) return { error: "Room not found in memory" };

	const updated = await roomManager.configureBot(roomId, {
		role: null,
		difficulty: null,
	});
	if (!updated) return { error: "Failed to remove bot" };

	await broadcastRoomSnapshot(roomId, "config_change", "connect4");

	revalidatePath(`/play/connect4/${roomId}`);
	return { ok: true };
}

// =============================================================================
// SLOT SWITCHING
// =============================================================================

/**
 * Switch the current player to a different slot in the room.
 * Uses loadAndValidateRoom for consistent hydration behaviour.
 */
export async function switchToSlot(params: {
	roomId: string;
	targetRole: "Red" | "Yellow";
}) {
	const session = await getSession();
	if (!session) return { error: "Unauthorized" };

	const { roomId, targetRole } = params;

	// Load (or rehydrate) the in-memory room
	const room = await loadAndValidateRoom(roomId);
	if (!room) return { error: "Room not found" };

	// Cannot switch once the game has started
	if (room.status !== "OPEN" && room.status !== "READY") {
		return { error: "Cannot switch spots once game has started" };
	}

	const switched = await roomManager.switchPlayerRole(
		roomId,
		session.userId,
		targetRole,
	);

	if (!switched) {
		return { error: "Slot not available or already occupied" };
	}

	await broadcastRoomSnapshot(roomId, "player_switched", "connect4");

	revalidatePath(`/play/connect4/${roomId}`);
	return { ok: true };
}

// =============================================================================
// LOBBY LEAVE / DELETE (re-exported for consistency with TTT shape)
// =============================================================================

export async function leaveLobbyRoom(
	roomId: string,
	userId: string,
): Promise<{ ok: boolean }> {
	const session = await getSession();
	if (!session) return { ok: false };

	await roomManager.removePlayerMembershipSafe(roomId, session.userId);

	return { ok: true };
}

export async function deleteLobbyRoom(
	roomId: string,
	userId: string,
): Promise<{ ok: boolean }> {
	const session = await getSession();
	if (!session) return { ok: false };

	const room = await prisma.room.findUnique({ where: { id: roomId } });
	if (!room || room.owner_id !== session.userId) return { ok: false };

	await roomManager.deleteRoomRecord(roomId);

	return { ok: true };
}
