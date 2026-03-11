/**
 * @file app/play/actions.ts
 * @description Generic server actions for lobby management across all games.
 */

"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/auth-session";
import { roomManager } from "@/lib/rooms";
import { RoomInfo } from "@/types/game";
import { GameRegistry } from "@/lib/game/GameRegistry";

// =============================================================================
// GENERIC LOBBY ACTIONS
// =============================================================================

/**
 * List all rooms for a specific game type.
 *
 * Also runs a lazy cleanup of stale OPEN rooms before returning so the lobby
 * never accumulates abandoned rooms from users who never came back.
 */
export async function listLobbyRooms(gameType: string): Promise<RoomInfo[]> {
	// Fire-and-forget cleanup — we don't want a cleanup failure to block the
	// lobby from loading, so errors are swallowed after logging.
	await roomManager.cleanupStaleRooms(gameType).catch((err) =>
		console.error("[listLobbyRooms] Stale room cleanup failed:", err),
	);

	const rooms = await prisma.room.findMany({
		where: { game_type: gameType },
		select: {
			id: true,
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

	const gameDef = GameRegistry.get(gameType);

	return rooms.map((room) => ({
		id: room.id,
		gameType: room.game_type, // Fixed property name to match interface
		gameName: gameDef ? gameDef.name : room.game_type,
		status: room.status as any,
		owner: room.owner
			? { ...room.owner, displayName: room.owner.display_name }
			: null,
		playerCount: room.players.length,
		maxPlayers: room.max_players,
		supportsBots: gameDef ? gameDef.supportsBots : false,
	}));
}

/**
 * Delete a room (only owner can delete).
 */
export async function deleteLobbyRoom(
	roomId: string,
	userId: string,
): Promise<{ ok: boolean; error?: string }> {
	const session = await getSession();
	if (!session) {
		return { ok: false, error: "Unauthorized" };
	}

	// Double check authorization on the server side
	if (session.userId.toString() !== userId) {
		return { ok: false, error: "Unauthorized user mismatch" };
	}

	const room = await prisma.room.findUnique({
		where: { id: roomId },
	});

	if (!room || room.owner_id !== session.userId) {
		return { ok: false, error: "Only the room owner can delete this room" };
	}

	await roomManager.deleteRoomRecord(roomId);

	return { ok: true };
}

/**
 * Leave a room lobby (removes player from DB).
 */
export async function leaveLobbyRoom(
	roomId: string,
	userId: string,
): Promise<{ ok: boolean }> {
	const session = await getSession();
	if (!session) {
		return { ok: false };
	}

	// Double check authorization on the server side
	if (session.userId.toString() !== userId) {
		return { ok: false };
	}

	await roomManager.removePlayerMembershipSafe(roomId, session.userId);

	return { ok: true };
}

/**
 * Fetch metadata for a room (Game independent).
 */
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
		game_type: room.game_type,
		status: room.status,
		owner: room.owner,
		players: room.players,
		board_state: room.board_state,
		current_turn: room.current_turn,
	};
}
