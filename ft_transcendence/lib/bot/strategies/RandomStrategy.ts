/**
 * @file RandomStrategy.ts
 * @description Simple strategy that picks random valid moves. Useful for testing or "Easy" mode fallback.
 */

import type { BotStrategy, BotConfig } from "../BotStrategy";

export interface RandomAdapter<TGameState, TMove> {
  getValidMoves(state: TGameState): TMove[];
}

export class RandomStrategy<TGameState, TMove>
  implements BotStrategy<TGameState, TMove>
{
  readonly id = "random";
  readonly name = "Random";
  readonly description = "Picks a random valid move";

  constructor(private adapter: RandomAdapter<TGameState, TMove>) {}

  getMove(gameState: TGameState, _config: BotConfig): TMove | null {
    const moves = this.adapter.getValidMoves(gameState);
    if (moves.length === 0) return null;
    return moves[Math.floor(Math.random() * moves.length)];
  }
}
