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
 *
 * Reconnection:
 * - When a player's SSE connection drops, their slot is NOT immediately freed.
 * - A RECONNECT_GRACE_MS timer is started instead.
 * - If the same player reconnects before the timer fires, the timer is
 *   cancelled and they seamlessly resume their slot without re-joining.
 * - If the timer fires (player is truly gone), the slot is freed and the
 *   remaining players are notified via a "player_left" broadcast.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSSEHandler } from "@/lib/sse/createSSEHandler";
import { getSession } from "@/lib/auth/auth-session";
import { loadAndValidateRoomSafe } from "@/lib/rooms";
import { roomManager } from "@/lib/rooms";
import { broadcaster } from "@/lib/broadcast";
import prisma from "@/lib/prisma";
import { GameRegistry } from "@/lib/game/GameRegistry";
import { RoomSnapshot, PlayerInfo } from "@/types/game";
import { getBotDisplayName, parseBotDifficulty } from "@/lib/bot/botHelpers";
import type Room from "@/lib/rooms/Room";

// =============================================================================
// RECONNECTION GRACE PERIOD
// =============================================================================

/**
 * How long (ms) to wait after an SSE disconnect before actually removing the
 * player from the room.  Covers brief network blips, page refreshes, and
 * mobile signal drops without disrupting the game.
 */
const RECONNECT_GRACE_MS = 15_000;

/**
 * Module-level map of pending player-removal timers.
 *
 * Key format: `"${roomId}:${userId}"`
 * Value: the NodeJS.Timeout that will fire and evict the player.
 *
 * Stored on globalThis so it survives Next.js hot-reloads in development
 * without leaking duplicate timers.
 */
const globalForSSE = globalThis as unknown as {
	_pendingRemovals: Map<string, NodeJS.Timeout> | undefined;
};

const pendingRemovals: Map<string, NodeJS.Timeout> =
	globalForSSE._pendingRemovals ?? new Map();

if (process.env.NODE_ENV !== "production") {
	globalForSSE._pendingRemovals = pendingRemovals;
}

function removalKey(roomId: string, userId: number): string {
	return `${roomId}:${userId}`;
}

/**
 * Cancel any pending removal timer for this player.
 * Called when the player reconnects before the grace period expires.
 */
function cancelPendingRemoval(roomId: string, userId: number): void {
	const key = removalKey(roomId, userId);
	const existing = pendingRemovals.get(key);
	if (existing) {
		clearTimeout(existing);
		pendingRemovals.delete(key);
	}
}

/**
 * Schedule a deferred player removal.
 *
 * The actual DB + in-memory removal is deferred by RECONNECT_GRACE_MS.
 * If the player reconnects in time, {@link cancelPendingRemoval} cancels this.
 *
 * @param roomId    - The room the player is leaving
 * @param userId    - The disconnecting player's ID
 * @param room      - In-memory Room instance (for removePlayer call)
 * @param removeFn  - Async function that performs the DB removal
 * @param broadcastFn - Async function that broadcasts "player_left"
 */
function schedulePendingRemoval(
	roomId: string,
	userId: number,
	room: Room,
	removeFn: (room: Room, userId: number) => Promise<void>,
	broadcastFn: (roomId: string, event: string) => Promise<void>,
): void {
	const key = removalKey(roomId, userId);

	// Always cancel any previous timer for this player first (idempotent)
	cancelPendingRemoval(roomId, userId);

	const timer = setTimeout(async () => {
		pendingRemovals.delete(key);
		try {
			await removeFn(room, userId);
			await broadcastFn(roomId, "player_left");
		} catch (err) {
			console.error("[SSE] Deferred player removal failed:", err);
		}
	}, RECONNECT_GRACE_MS);

	pendingRemovals.set(key, timer);
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createGameSSERouteHandler(gameId: string) {
	const gameDef = GameRegistry.getOrThrow(gameId);

	// ---------------------------------------------------------------------------
	// HELPER: Build snapshot from Prisma room
	// ---------------------------------------------------------------------------
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
		const players: PlayerInfo[] = room.players.map(
			(p: any): PlayerInfo => ({
				userId: p.user_id,
				displayName: p.user.display_name,
				role: p.role,
				isConnected: true,
				isBot: false,
			}),
		);

		// Add bot as a virtual player if configured
		if (room.bot_role && room.bot_difficulty) {
			players.push({
				userId: -1,
				displayName: getBotDisplayName(room.bot_difficulty),
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
			bot: room.bot_role
				? {
						role: room.bot_role,
						difficulty: parseBotDifficulty(room.bot_difficulty),
						delayMs: room.bot_delay_ms ?? 500,
					}
				: null,
		};
	}

	// ---------------------------------------------------------------------------
	// HELPER: Broadcast snapshot to all room subscribers
	// ---------------------------------------------------------------------------
	async function broadcastSnapshot(roomId: string, event: string) {
		const snapshot = await getRoomSnapshot(roomId);
		if (!snapshot) return;
		broadcaster.broadcast(roomId, JSON.stringify({ event, ...snapshot }));
	}

	// ---------------------------------------------------------------------------
	// HELPER: Add player to room
	// Algorithm: First-come-first-served role assignment
	// Security: Server controls role, not client
	// ---------------------------------------------------------------------------
	async function addPlayerToRoom(room: Room, userId: number): Promise<string | null> {
		return roomManager.ensurePlayerMembership(room.roomId, userId);
	}

	// ---------------------------------------------------------------------------
	// HELPER: Permanently remove a player from the room (DB + status revert)
	// Called by the grace-period timer, not directly on disconnect.
	// ---------------------------------------------------------------------------
	async function removePlayer(room: Room, userId: number): Promise<void> {
		try {
			await roomManager.removePlayerMembership(room.roomId, userId);
		} catch (error) {
			console.error("[SSE] Remove player error:", error);
		}
	}

	// ---------------------------------------------------------------------------
	// ROUTE HANDLER
	// ---------------------------------------------------------------------------
	return async function GET(
		request: NextRequest,
		paramsObj: { params: Promise<{ roomId: string }> },
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

		// Cancel any pending eviction for this player — they reconnected in time.
		cancelPendingRemoval(roomId, session.userId);

		// Add player (no-op if they already have a slot from a previous connection)
		const role = await addPlayerToRoom(room, session.userId);
		if (role) {
			try {
				// Membership/role assignment already handled via Room persistence helper.
			} catch (error) {
				// Roll back the DB insert if the in-memory add fails
				await removePlayer(room, session.userId);
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

			onCleanup: () => {
				// Do NOT remove the player immediately.  Schedule a deferred eviction
				// so that brief network blips / page refreshes don't destroy a slot.
				schedulePendingRemoval(
					roomId,
					session.userId,
					room,
					removePlayer,
					broadcastSnapshot,
				);
			},
		});
	};
}
