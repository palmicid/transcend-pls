/**
 * @file Game.ts
 * @description Abstract base class for all game implementations.
 *
 * This class defines the contract that all games must follow. It provides
 * a consistent interface for:
 * - Player management (connect, disconnect, reconnect)
 * - Game state updates (actions, validation, state machine)
 * - Game flow control (start, pause, end)
 * - Result reporting
 *
 * @example
 * ```ts
 * import { Game, GameConfig, GameState, PlayerSlot } from '@/lib/game';
 *
 * class TicTacToeGame extends Game<TicTacToeConfig, TicTacToeState, TicTacToePlayerSlot> {
 *   get type() { return 'tic-tac-toe'; }
 *   // ... implement all abstract methods
 * }
 * ```
 */

import type PlayerSlot from "./PlayerSlot";
import type GameState from "./GameState";
import type GameConfig from "./GameConfig";

/**
 * Abstract Game Class
 *
 * All game implementations must extend this class and implement all abstract
 * methods. The class uses generics to allow type-safe configuration, state,
 * and player slot types per game.
 *
 * @typeParam TConfig - The game's configuration type (extends GameConfig)
 * @typeParam TState - The game's state type (extends GameState)
 * @typeParam TPlayerSlot - The game's player slot type (extends PlayerSlot)
 */
export default abstract class Game<
  TConfig extends GameConfig,
  TState extends GameState,
  TPlayerSlot extends PlayerSlot
> {
  // ===========================================================================
  // GAME METADATA
  // ===========================================================================

  /**
   * Unique game type identifier.
   *
   * Used to distinguish between different game implementations.
   * Should be a lowercase kebab-case string.
   *
   * @example 'tic-tac-toe', 'pong', 'rock-paper-scissors'
   */
  abstract get type(): string;

  /**
   * Initialize the game with default configuration and state.
   *
   * Called when creating a new game or resetting an existing one.
   * Should set up fresh playerslot, gameState, and gameConfig.
   */
  abstract init(): void;

  // ===========================================================================
  // PLAYER MANAGEMENT
  // ===========================================================================

  /**
   * Player slot configuration for this game.
   *
   * Describes which slots are available and which players occupy them.
   */
  abstract playerslot: TPlayerSlot;

  /**
   * Get the role or position of a specific player.
   *
   * @param playerId - The unique identifier of the player
   * @returns The player's role (e.g., 'X', 'O', 'spectator') or null if not found
   */
  abstract getPlayerRole(playerId: string): string;

  /**
   * Check if the game can accept more players.
   *
   * @returns true if there are empty slots available
   */
  abstract get canAcceptMorePlayers(): boolean;

  // ===========================================================================
  // CONNECTION HANDLING
  // ===========================================================================

  /**
   * Handle a player connecting to the game.
   *
   * Called when a player joins the room. Should assign them to an available slot.
   *
   * @param playerId - The unique identifier of the connecting player
   */
  abstract handlePlayerConnect(playerId: string): void;

  /**
   * Handle a player disconnecting from the game.
   *
   * Called when a player leaves or loses connection. May trigger a game pause.
   *
   * @param playerId - The unique identifier of the disconnecting player
   */
  abstract handlePlayerDisconnect(playerId: string): void;

  /**
   * Handle a player reconnecting to the game.
   *
   * Called when a previously disconnected player returns. May resume the game.
   *
   * @param playerId - The unique identifier of the reconnecting player
   */
  abstract handlePlayerReconnect(playerId: string): void;

  /**
   * Get the timeout threshold before considering a player as lost.
   *
   * Used to determine when to auto-disconnect idle players.
   *
   * @returns Timeout in milliseconds (e.g., 30000 for 30 seconds)
   */
  abstract getPlayerTimeoutThreshold(): number;

  // ===========================================================================
  // PLAYER ACTIONS
  // ===========================================================================

  /**
   * Process a player's action or move.
   *
   * Called when a player submits an action. The action format is game-specific.
   * Should update the game state accordingly.
   *
   * @param playerId - The player making the action
   * @param action - The action payload (game-specific format)
   */
  abstract playerAction(playerId: string, action: unknown): void;

  /**
   * Validate if an action is legal for the given player.
   *
   * Called before processing an action to ensure it's valid.
   *
   * @param playerId - The player attempting the action
   * @param action - The action to validate
   * @returns true if the action is valid and can be processed
   */
  abstract isValidAction(playerId: string, action: unknown): boolean;

  // ===========================================================================
  // GAME STATE
  // ===========================================================================

  /**
   * Current game state.
   *
   * Contains all dynamic game data (board, scores, timers, etc.)
   */
  abstract gameState: TState;

  /**
   * Load or initialize the game state.
   *
   * Called when setting up a new game. Can load from database or create fresh state.
   */
  abstract loadState(): void;

  /**
   * Update the game state after an action.
   *
   * Called after processing a player action. Handles physics simulation,
   * turn progression, win condition checks, etc.
   */
  abstract updateState(): void;

  /**
   * Get a snapshot of the current game state for client broadcast.
   *
   * Returns a serializable object that clients can use to render the game.
   * May exclude sensitive information that shouldn't be sent to clients.
   */
  abstract get Snapshot(): unknown;

  // ===========================================================================
  // GAME CONFIGURATION
  // ===========================================================================

  /**
   * Game configuration settings.
   *
   * Contains static game settings (board size, time limits, etc.)
   */
  abstract gameConfig: TConfig;

  /**
   * Load game configuration.
   *
   * Called when setting up a new game. Can load from database or use defaults.
   */
  abstract loadConfig(): void;

  // ===========================================================================
  // GAME FLOW CONTROL
  // ===========================================================================

  /**
   * Check if the game is ready to start.
   *
   * @returns true if all required players are connected and game is configured
   */
  abstract get isReady2Start(): boolean;

  /**
   * Start the game loop.
   *
   * Called when transitioning from READY to IN_GAME state.
   * Initializes timers, sets start time, etc.
   */
  abstract startGame(): void;

  /**
   * Pause the game.
   *
   * Called when a critical player disconnects or pause is requested.
   * Should preserve state for resumption.
   */
  abstract pauseGame(): void;

  /**
   * End the game and cleanup resources.
   *
   * Called when the game reaches a terminal state (win, draw, forfeit).
   * Should finalize results and cleanup any timers/resources.
   */
  abstract endGame(): void;

  /**
   * Check if end conditions are met.
   *
   * @returns true if the game should end (someone won, draw, time expired)
   */
  abstract checkEndConditions(): boolean;

  // ===========================================================================
  // GAME RESULTS
  // ===========================================================================

  /**
   * Get the final game result.
   *
   * @returns Object containing winner, scores, statistics, etc.
   */
  abstract get result(): unknown;
}
