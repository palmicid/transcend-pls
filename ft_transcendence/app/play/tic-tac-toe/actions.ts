/**
 * @file app/play/tic-tac-toe/actions.ts
 * @description Server actions for Tic-Tac-Toe game and lobby management.
 *
 * Bot and broadcast helpers are intentionally imported from the shared
 * lib/game/gameActions module — do NOT add private copies here.
 */

"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/auth-session";
import { loadAndValidateRoom } from "@/lib/rooms";
import { broadcaster } from "@/lib/broadcast";
import { roomManager } from "@/lib/rooms";
import TicTacToeGame from "@/lib/game/tic-tac-toe/TicTacToeGame";
import {
	attachBotMoveCallback,
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

export async function getRoomMeta(roomId: string) {
	const room = await prisma.room.findUnique({
		where: { id: roomId },
		include: {
			owner: { select: { id: true, display_name: true } },
			players: { select: { user_id: true, role: true } },
		},
	});

	if (!room) return null;

	return {
		id: room.id,
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

export async function submitTicTacToeMove(
	roomId: string,
	playerId: string,
	cell: number,
) {
	const session = await getSession();
	if (!session) {
		return { ok: false, snapshot: null };
	}

	try {
		const room = await loadAndValidateRoom(roomId);
		if (!room) {
			return { ok: false, snapshot: null };
		}

		attachBotMoveCallback(roomId, room, "tic-tac-toe");

		const success = await roomManager.submitAction(
			roomId,
			session.userId.toString(),
			{ cell },
		);

		if (success) {
			await broadcastRoomSnapshot(roomId, "game_move", "tic-tac-toe");
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
		const room = await loadAndValidateRoom(roomId);
		if (!room) return { ok: false };

		attachBotMoveCallback(roomId, room, "tic-tac-toe");

		const started = await roomManager.start(roomId);

		if (started) {
			await broadcastRoomSnapshot(roomId, "game_start", "tic-tac-toe");
		}

		return { ok: started };
	} catch (error) {
		console.error("Failed to start game:", error);
		return { ok: false };
	}
}

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
