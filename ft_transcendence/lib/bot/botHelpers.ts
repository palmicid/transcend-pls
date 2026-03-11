/**
 * @file lib/bot/botHelpers.ts
 * @description Shared bot-related utilities across games.
 */

import type { Room } from "@/lib/rooms";
import type { BotDifficulty } from "./constants";
import { BOT_DIFFICULTIES } from "./constants";

/**
 * Check if a room has a fully configured bot (both role and difficulty set).
 */
export function isBotConfigured(
	botRole: string | null | undefined,
	botDifficulty: BotDifficulty | string | null | undefined,
): boolean {
	return !!(botRole && botDifficulty);
}

/**
 * Count total players in a room including the bot if configured.
 */
export function getTotalPlayerCount(
	humanPlayerCount: number,
	botRole: string | null | undefined,
	botDifficulty: BotDifficulty | string | null | undefined,
): number {
	return humanPlayerCount + (isBotConfigured(botRole, botDifficulty) ? 1 : 0);
}

/**
 * Get a user-friendly label for bot difficulty.
 * Since difficulty is already stored as a human-readable string, this simply
 * returns the value directly — falling back to "Hard" for any unrecognised
 * or missing value.
 */
export function getBotDifficultyLabel(
	difficulty: BotDifficulty | string | null | undefined,
): string {
	if (
		difficulty &&
		(BOT_DIFFICULTIES as readonly string[]).includes(difficulty)
	) {
		return difficulty;
	}
	return "Hard";
}

/**
 * Build a consistent display name for bot players.
 */
export function getBotDisplayName(
	difficulty: BotDifficulty | string | null | undefined,
): string {
	return `Bot (${getBotDifficultyLabel(difficulty)})`;
}

/**
 * Validate bot configuration options with allowed roles.
 * Throws a descriptive error if role or difficulty is invalid.
 */
export function validateBotConfig(
	role: string,
	difficulty: string,
	allowedRoles: readonly string[],
): void {
	if (!allowedRoles.includes(role)) {
		throw new Error(
			`Invalid bot role: ${role}. Must be ${allowedRoles.map((r) => `"${r}"`).join(" or ")}.`,
		);
	}

	if (!(BOT_DIFFICULTIES as readonly string[]).includes(difficulty)) {
		throw new Error(
			`Invalid bot difficulty: "${difficulty}". Must be "Easy", "Medium", or "Hard".`,
		);
	}
}

/**
 * Narrow an arbitrary string value (as stored in the DB) to `BotDifficulty`.
 * Returns `null` for `null`, `undefined`, or any value that is not one of the
 * three recognised difficulty tiers, preventing unexpected strings from
 * leaking into the domain model.
 */
export function parseBotDifficulty(
	value: string | null | undefined,
): BotDifficulty | null {
	if (value && (BOT_DIFFICULTIES as readonly string[]).includes(value)) {
		return value as BotDifficulty;
	}
	return null;
}

/**
 * Get bot configuration from a room for Prisma updates.
 */
export interface BotPrismaConfig {
	bot_role: string | null;
	bot_difficulty: BotDifficulty | null;
	bot_delay_ms?: number;
}

export function getBotPrismaConfig(
	botRole: string | null,
	botDifficulty: BotDifficulty | null,
	botDelayMs?: number,
): BotPrismaConfig {
	return {
		bot_role: botRole,
		bot_difficulty: botDifficulty,
		bot_delay_ms: botDelayMs,
	};
}

/**
 * Create a standardized bot move callback for syncing and broadcasting.
 * Handles end-of-game transitions automatically.
 */
export function createBotMoveCallback(
	roomId: string,
	room: Room,
	game: { checkEndConditions: () => boolean },
	syncFn: (roomId: string, room: Room) => Promise<void>,
	broadcastFn: (roomId: string, event: string) => Promise<void>,
	prismaUpdateFn: (roomId: string, status: string) => Promise<void>,
): () => Promise<void> {
	return async () => {
		await syncFn(roomId, room);
		await broadcastFn(roomId, "game_move");

		if (game.checkEndConditions()) {
			room.end();
			await prismaUpdateFn(roomId, "ENDED");
			await broadcastFn(roomId, "game_end");
		}
	};
}
