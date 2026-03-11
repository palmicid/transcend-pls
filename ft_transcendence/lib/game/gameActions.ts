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
import { getBotDisplayName } from "@/lib/bot/botHelpers";
import { saveGameResult } from "@/lib/game/saveGameResult";
import logger from "@/lib/logger";

async function requestSaveOnGameEnd(
	roomId: string,
	gameId: string,
	snapshot: { board?: unknown } | null,
): Promise<void> {
	if (!snapshot?.board) {
		logger.debug({
			msg: "Skipping game result save: missing board snapshot",
			roomId,
			gameId,
		});
		return;
	}

	const gameDef = GameRegistry.get(gameId);
	if (!gameDef) {
		logger.warn({
			msg: "Skipping game result save: unknown game definition",
			roomId,
			gameId,
		});
		return;
	}

	const board = gameDef.parseBoard(snapshot.board);
	const winner = gameDef.checkWin(board);
	const isDraw = gameDef.checkDraw(board, winner);

	if (!winner && !isDraw) {
		logger.debug({
			msg: "Skipping game result save: game has not ended",
			roomId,
			gameId,
		});
		return;
	}

	const [dbRoom, roomPlayers] = await Promise.all([
		prisma.room.findUnique({ where: { id: roomId } }),
		prisma.roomPlayer.findMany({
			where: { room_id: roomId },
			select: { user_id: true, role: true },
		}),
	]);

	if (!dbRoom) {
		logger.warn({
			msg: "Skipping game result save: room not found",
			roomId,
			gameId,
		});
		return;
	}

	logger.info({
		msg: "Attempting to persist game result",
		roomId,
		gameId,
		winnerRole: winner,
		isDraw,
		playerCount: roomPlayers.length,
	});

	const persistedResult = await saveGameResult({
		gameType: gameId,
		roomId,
		players: roomPlayers.map((p: { user_id: number; role: string }) => ({
			id: p.user_id,
			role: p.role,
		})),
		winnerRole: winner,
		isDraw,
		startedAt: dbRoom.created_at,
		finalBoard: snapshot.board,
	});

	if (persistedResult) {
		logger.info({
			msg: "Game result persisted",
			roomId,
			gameId,
			gameResultId: persistedResult.id,
		});
		return;
	}

	logger.info({
		msg: "Game result not persisted due to guard conditions",
		roomId,
		gameId,
	});
}

/**
 * Single post-move handler used by both human and bot paths.
 *
 * Checks terminal state → transitions room → persists to DB →
 * saves game result (if eligible) → broadcasts SSE event.
 */
async function finalizeMove(
	roomId: string,
	room: Room,
	gameId: string,
): Promise<void> {
	const ended = room.isTerminal();

	if (ended && room.status !== "ENDED") {
		room.end();
	}

	await roomManager.persistStateToDb(roomId);

	if (ended) {
		await requestSaveOnGameEnd(roomId, gameId, room.getSnapshot() as any);
	}

	await broadcastRoomSnapshot(
		roomId,
		ended ? "game_end" : "game_move",
		gameId,
	);
}

export async function attachBotMoveCallback(
	roomId: string,
	room: Room,
	gameId: string,
): Promise<void> {
	const game: any = room.game;
	if (!game || typeof game.onBotMove === "undefined") return;

	game.onBotMove = async () => {
		await finalizeMove(roomId, room, gameId);
	};
}

export async function broadcastRoomSnapshot(
	roomId: string,
	event: string,
	gameId: string,
): Promise<void> {
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

	const players = room.players.map((p: any) => ({
		userId: p.user_id,
		displayName: p.user.display_name,
		role: p.role,
		isConnected: true,
		isBot: false,
	}));

	if (room.bot_role && room.bot_difficulty) {
		players.push({
			userId: -1,
			displayName: getBotDisplayName(room.bot_difficulty),
			role: room.bot_role,
			isConnected: true,
			isBot: true,
		});
	}

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
			players,
			maxPlayers: room.max_players,
			bot: room.bot_role
				? {
						role: room.bot_role,
						difficulty: room.bot_difficulty,
						delayMs: room.bot_delay_ms ?? 500,
					}
				: null,
		}),
	);
}

// =============================================================================
// PUBLIC ACTIONS
// =============================================================================

/**
 * Create a new game room.
 */
export async function createGameRoom(
	gameId: string,
): Promise<{ ok: boolean; roomId?: string; error?: string }> {
	const session = await getSession();
	if (!session) return { ok: false, error: "Unauthorized" };

	const gameDef = GameRegistry.get(gameId);
	if (!gameDef) return { ok: false, error: "Unknown game type" };

	const user = await prisma.user.findUnique({ where: { id: session.userId } });
	if (!user) return { ok: false, error: "User not found" };

	try {
		const roomId = `room-${Math.random().toString(36).substring(2, 9)}`;

		const room = await roomManager.createRoomRecord({
			id: roomId,
			gameType: gameId,
			ownerId: session.userId,
			maxPlayers: gameDef.maxPlayers,
			boardState: gameDef.createEmptyBoard() as any,
			currentTurn: gameDef.firstTurn,
		});

		const game = gameDef.createGame();
		game.init();
		roomManager.attachGame(
			room.id,
			game,
			broadcaster,
			session.userId.toString(),
		);

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
	gameId: string,
): Promise<{ ok: boolean; error?: string; snapshot: unknown }> {
	const session = await getSession();
	if (!session) return { ok: false, error: "Unauthorized", snapshot: null };

	const gameDef = GameRegistry.get(gameId);
	if (!gameDef) return { ok: false, error: "Unknown game", snapshot: null };

	try {
		const room = await loadAndValidateRoom(roomId);
		if (!room) return { ok: false, error: "Room not found", snapshot: null };

		attachBotMoveCallback(roomId, room, gameId);

		// Get current state from DB for validation
		const dbRoom = await prisma.room.findUnique({ where: { id: roomId } });
		if (!dbRoom) return { ok: false, error: "Room not found", snapshot: null };

		// Get player's role
		const player = await prisma.roomPlayer.findUnique({
			where: { room_id_user_id: { room_id: roomId, user_id: session.userId } },
		});
		if (!player?.role)
			return { ok: false, error: "Not in room", snapshot: null };

		// Validate action using registry
		const board = gameDef.parseBoard(dbRoom.board_state);
		const validation = gameDef.validateAction(
			board,
			action,
			player.role,
			dbRoom.current_turn || gameDef.firstTurn,
		);

		if (!validation.valid) {
			return { ok: false, error: validation.error, snapshot: null };
		}

		// Apply move to in-memory room (validate → apply → updateState)
		const applied = room.submitAction(
			session.userId.toString(),
			action,
		);
		if (!applied) return { ok: false, error: "Move rejected", snapshot: null };

		// Single post-move path: end-check → persist → save result → broadcast
		await finalizeMove(roomId, room, gameId);

		return { ok: true, snapshot: room.getSnapshot() };
	} catch (error) {
		console.error("Submit move failed:", error);
		return { ok: false, error: "Server error", snapshot: null };
	}
}

/**
 * Start a game (READY → IN_GAME).
 */
export async function startGame(
	roomId: string,
	gameId: string,
): Promise<{ ok: boolean }> {
	const session = await getSession();
	if (!session) return { ok: false };

	try {
		const room = await loadAndValidateRoom(roomId);
		if (!room) return { ok: false };

		attachBotMoveCallback(roomId, room, gameId);

		const started = await roomManager.start(roomId);

		if (started) {
			await broadcastRoomSnapshot(roomId, "game_start", gameId);
		}

		return { ok: started };
	} catch (error) {
		console.error("Start game failed:", error);
		return { ok: false };
	}
}
