/**
 * @file BotRegistry.ts
 * @description Registry for available bot strategies. Enables loose coupling and future extensibility.
 */

import type { BotStrategy } from "./BotStrategy";

class BotRegistryClass {
  private strategies: Map<string, BotStrategy<any, any>> = new Map();

  /**
   * Register a new bot strategy.
   * @param strategy - The strategy instance to register
   */
  register<TGameState, TMove>(strategy: BotStrategy<TGameState, TMove>): void {
    if (this.strategies.has(strategy.id)) {
      console.warn(`[BotRegistry] Overwriting strategy with ID: ${strategy.id}`);
    }
    this.strategies.set(strategy.id, strategy);
  }

  /**
   * Get a registered strategy by ID.
   * @param id - The ID of the strategy to retrieve
   */
  get<TGameState, TMove>(id: string): BotStrategy<TGameState, TMove> | undefined {
    return this.strategies.get(id) as BotStrategy<TGameState, TMove> | undefined;
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

// Export singleton instance
export const BotRegistry = new BotRegistryClass();
