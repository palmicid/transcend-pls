/**
 * @file Connect4Config.ts
 * @description Configuration settings for Connect Four games.
 *
 * Defines the static settings that don't change during gameplay,
 * like board dimensions, available player colors, and bot configuration.
 */

import { GameConfig } from "@/lib/game";
import type { PlayerColor } from "./Connect4PlayerSlot";
import type { BotDifficulty } from "@/lib/bot/constants";

/**
 * Configuration for a Connect Four game.
 *
 * Connect Four is played on a 7-column × 6-row grid.
 * Two players alternate dropping colored discs.
 */
export default class Connect4Config implements GameConfig {
	/** Number of columns (width) */
	readonly columns = 7;

	/** Number of rows (height) */
	readonly rows = 6;

	/** Pieces needed in a row to win */
	readonly winCondition = 4;

	/** Available player colors */
	readonly players = ["Red", "Yellow"] as const;

	// ===========================================================================
	// BOT CONFIGURATION
	// ===========================================================================

	/** Bot difficulty tier: "Easy" | "Medium" | "Hard", null = no bot */
	botDifficulty: BotDifficulty | null = null;

	/** Which role the bot plays (null if no bot) */
	botRole: PlayerColor | null = null;

	/** Delay before bot makes a move (milliseconds) for human-like feel */
	botDelayMs: number = 500;

	// ===========================================================================
	// COMPUTED PROPERTIES
	// ===========================================================================

	/** Whether this game has an active bot */
	get hasBot(): boolean {
		return this.botRole !== null && this.botDifficulty !== null;
	}
}
