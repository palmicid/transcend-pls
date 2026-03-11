/**
 * @file app/play/tic-tac-toe/actions.ts
 * @description Server actions for Tic-Tac-Toe game and lobby management.
 *
 * Move / start / broadcast logic is delegated to the shared
 * lib/game/gameActions module — game-specific files only contain
 * lobby creation (custom room-id support) and bot/slot helpers.
 */

"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/auth-session";
import { loadAndValidateRoom } from "@/lib/rooms";
import { broadcaster } from "@/lib/broadcast";
import { roomManager } from "@/lib/rooms";
import TicTacToeGame from "@/lib/game/tic-tac-toe/TicTacToeGame";
import {
	submitGameMove,
	startGame,
	broadcastRoomSnapshot,
} from "@/lib/game/gameActions";
import type { BotDifficulty } from "@/lib/bot/constants";

// =============================================================================
// LOBBY ACTIONS
// =============================================================================

export async function createTicTacToeRoom(roomId?: string) {
	const session = await getSession();
	if (!session) {
		return { ok: false, error: "Unauthorized" };
	}

	const user = await prisma.user.findUnique({ where: { id: session.userId } });
	if (!user) {
		return { ok: false, error: "User not found" };
	}

	try {
		const generatedRoomId =
			roomId || `room-${Math.random().toString(36).substring(2, 9)}`;

		const room = await roomManager.createRoomRecord({
			id: generatedRoomId,
			gameType: "tic-tac-toe",
			ownerId: session.userId,
			maxPlayers: 2,
			boardState: Array(9).fill(null),
			currentTurn: "X",
		});

		const game = new TicTacToeGame();
		game.init();
		roomManager.attachGame(
			room.id,
			game,
			broadcaster,
			session.userId.toString(),
		);

		return { ok: true, roomId: room.id };
	} catch (error) {
		console.error("Failed to create room:", error);
		return { ok: false, error: "Failed to create room" };
	}
}

// =============================================================================
// GENERIC ROOM ACTIONS (delegated to shared helpers)
// =============================================================================

export const submitTicTacToeMove = async (
	roomId: string,
	_playerId: string,
	cell: number,
) => await submitGameMove(roomId, { cell }, "tic-tac-toe");

export const startTicTacToeGame = async (roomId: string) =>
	await startGame(roomId, "tic-tac-toe");

// =============================================================================
// BOT ACTIONS
// =============================================================================

/**
 * Configure a bot for a player slot in Tic-Tac-Toe.
 * Uses loadAndValidateRoom so it works even after a server restart.
 */
export async function setBotForSlot(params: {
	roomId: string;
	role: "X" | "O";
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
	if (!room) return { error: "Room not found" };

	const updated = await roomManager.configureBot(roomId, {
		role,
		difficulty,
		delayMs: 500,
	});
	if (!updated) return { error: "Failed to configure bot" };

	await broadcastRoomSnapshot(roomId, "config_change", "tic-tac-toe");

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
	if (!room) return { error: "Room not found" };

	const updated = await roomManager.configureBot(roomId, {
		role: null,
		difficulty: null,
	});
	if (!updated) return { error: "Failed to remove bot" };

	await broadcastRoomSnapshot(roomId, "config_change", "tic-tac-toe");

	return { ok: true };
}

// =============================================================================
// SLOT SWITCHING
// =============================================================================

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

	const room = await loadAndValidateRoom(roomId);
	if (!room) return { error: "Room not found" };

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

	await broadcastRoomSnapshot(roomId, "player_switched", "tic-tac-toe");

	return { ok: true };
}

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
