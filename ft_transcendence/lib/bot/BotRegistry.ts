/**
 * @file BotRegistry.ts
 * @description Registry for available bot strategies. Enables loose coupling and future extensibility.
 */

import type { BotStrategy } from "./BotStrategy";

class BotRegistryClass {
	private strategies: Map<string, BotStrategy<any, any>> = new Map();

	/**
	 * Register a new bot strategy.
	 * If a strategy with the same ID is already registered, it is silently
	 * replaced (idempotent re-registration is expected during hot-reloads).
	 *
	 * @param strategy - The strategy instance to register
	 */
	register<TGameState, TMove>(strategy: BotStrategy<TGameState, TMove>): void {
		this.strategies.set(strategy.id, strategy);
	}

	/**
	 * Check whether a strategy with the given ID has been registered.
	 *
	 * @param id - The strategy ID to look up
	 */
	has(id: string): boolean {
		return this.strategies.has(id);
	}

	/**
	 * Get a registered strategy by ID.
	 *
	 * @param id - The ID of the strategy to retrieve
	 * @returns The strategy instance, or undefined if not found
	 */
	get<TGameState, TMove>(
		id: string,
	): BotStrategy<TGameState, TMove> | undefined {
		return this.strategies.get(id) as
			| BotStrategy<TGameState, TMove>
			| undefined;
	}

	/**
	 * List all registered strategies (id, name, description).
	 * Useful for populating UI selection menus.
	 */
	list(): { id: string; name: string; description: string }[] {
		return Array.from(this.strategies.values()).map((s) => ({
			id: s.id,
			name: s.name,
			description: s.description,
		}));
	}
}

// =============================================================================
// SINGLETON
// =============================================================================

/**
 * Global BotRegistry instance.
 * Stored on globalThis so it survives Next.js hot-reloads in development,
 * preventing duplicate-registration noise on every file change.
 */
const globalForBot = globalThis as unknown as {
	botRegistry: BotRegistryClass | undefined;
};

export const BotRegistry = globalForBot.botRegistry ?? new BotRegistryClass();

if (process.env.NODE_ENV !== "production") {
	globalForBot.botRegistry = BotRegistry;
}
