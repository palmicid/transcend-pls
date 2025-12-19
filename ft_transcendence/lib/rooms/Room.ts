/**
 * @file Room.ts
 * @description Individual game room that holds a single game instance.
 *
 * A Room is the container for a game session. It manages:
 * - The game instance (TicTacToe, Pong, etc.)
 * - Player connections (join, leave, reconnect)
 * - Game lifecycle (start, pause, end)
 * - Broadcasting state updates to connected clients
 *
 * Rooms are ephemeral and managed by the RoomManager singleton.
 *
 * @example
 * ```ts
 * import { Room } from '@/lib/rooms';
 * import { broadcaster } from '@/lib/broadcast';
 *
 * const room = new Room('game-123', broadcaster, 'owner-user-id');
 * room.attachGame(new TicTacToeGame());
 * room.addPlayer('player-1');
 * room.start();
 * ```
 */

import { Game, GameConfig, GameState, PlayerSlot } from "@/lib/game";
import { Broadcaster } from "@/lib/broadcast";
import RoomState, { State } from "./RoomState";

/**
 * Ephemeral room instance holding a single game.
 *
 * Each room has:
 * - A unique ID
 * - An owner (optional, for room management permissions)
 * - A game instance
 * - A broadcaster for real-time updates
 * - A state machine tracking the room lifecycle
 */
export default class Room {
  /** Unique room identifier */
  private id: string;

  /** Broadcaster for sending updates to connected clients */
  private broadcaster: Broadcaster | null;

  /** The game instance (null until attached) */
  private game: Game<GameConfig, GameState, PlayerSlot> | null;

  /** Room lifecycle state machine */
  private state: RoomState;

  /** Owner's user ID (can delete room, start game, etc.) */
  private ownerId: string | null;

  /**
   * Create a new room instance.
   *
   * @param id - Unique room identifier
   * @param broadcaster - Optional broadcaster for real-time updates
   * @param ownerId - Optional owner user ID
   */
  constructor(
    id: string,
    broadcaster: Broadcaster | null = null,
    ownerId: string | null = null
  ) {
    this.id = id;
    this.broadcaster = broadcaster;
    this.state = new RoomState();
    this.game = null;
    this.ownerId = ownerId;
  }

  // ===========================================================================
  // GETTERS
  // ===========================================================================

  /** Get the room's unique ID */
  get roomId(): string {
    return this.id;
  }

  /** Get the current room status (OPEN, READY, IN_GAME, ENDED) */
  get status(): State {
    return this.state.current;
  }

  /** Get the owner's user ID */
  get owner(): string | null {
    return this.ownerId;
  }

  /** Get the game type if a game is attached */
  get gameType(): string | null {
    return this.game?.type ?? null;
  }

  /** Get the number of players currently in the room */
  get playerCount(): number {
    if (!this.game) return 0;
    const snapshot = this.game.Snapshot as { players?: Record<string, string | null> } | null;
    if (!snapshot?.players) return 0;
    return Object.values(snapshot.players).filter((p) => p !== null).length;
  }

  // ===========================================================================
  // SETUP
  // ===========================================================================

  /**
   * Set the owner if one hasn't been set yet.
   *
   * @param ownerId - The user ID to set as owner
   */
  setOwnerIfEmpty(ownerId?: string | null): void {
    if (!this.ownerId && ownerId) {
      this.ownerId = ownerId;
    }
  }

  /**
   * Attach or replace the broadcaster.
   *
   * @param broadcaster - The broadcaster instance
   */
  attachBroadcaster(broadcaster: Broadcaster): void {
    this.broadcaster = broadcaster;
  }

  /**
   * Attach a game to this room.
   *
   * Loads the game's configuration and state. The game must be fully
   * initialized before attaching.
   *
   * @param game - The game instance to attach
   */
  attachGame(game: Game<GameConfig, GameState, PlayerSlot>): void {
    this.game = game;
    this.game.loadConfig();
    this.game.loadState();
  }

  // ===========================================================================
  // PLAYER MANAGEMENT
  // ===========================================================================

  /**
   * Add a player to the room.
   *
   * Automatically transitions to READY state if the game has enough players.
   * Broadcasts a snapshot after the player joins.
   *
   * @param playerId - The user ID of the player
   * @returns true if the player was added successfully
   */
  addPlayer(playerId: string): boolean {
    if (!this.game) return false;
    if (!this.game.canAcceptMorePlayers) return false;

    this.game.handlePlayerConnect(playerId);

    // Auto-transition to READY if we have enough players
    if (this.game.isReady2Start && this.state.current === State.OPEN) {
      this.state.transitionTo(State.READY);
    }

    this.broadcastSnapshot();
    return true;
  }

  /**
   * Remove a player from the room.
   *
   * Automatically pauses the game if it's in progress.
   * Broadcasts a snapshot after the player leaves.
   *
   * @param playerId - The user ID of the player
   * @returns true if the player was removed successfully
   */
  removePlayer(playerId: string): boolean {
    if (!this.game) return false;

    this.game.handlePlayerDisconnect(playerId);

    // Pause if a player leaves during a game
    if (this.state.current === State.IN_GAME) {
      this.pause();
    }

    this.broadcastSnapshot();
    return true;
  }

  // ===========================================================================
  // GAME ACTIONS
  // ===========================================================================

  /**
   * Submit a player action to the game.
   *
   * Validates the action before processing. If the action causes the game
   * to end, automatically transitions to ENDED state.
   *
   * @param playerId - The player making the action
   * @param action - The action payload (game-specific format)
   * @returns true if the action was valid and processed
   */
  submitAction(playerId: string, action: unknown): boolean {
    if (!this.game) return false;
    if (!this.game.isValidAction(playerId, action)) return false;

    this.game.playerAction(playerId, action);
    this.game.updateState();
    this.broadcastSnapshot();

    // Check if game ended
    if (this.game.checkEndConditions()) {
      this.end();
    }

    return true;
  }

  /**
   * Get the current game snapshot for client display.
   *
   * @returns The game snapshot, or null if no game attached
   */
  getSnapshot(): unknown {
    return this.game ? this.game.Snapshot : null;
  }

  // ===========================================================================
  // GAME FLOW CONTROL
  // ===========================================================================

  /**
   * Start the game.
   *
   * Transitions from READY to IN_GAME state and starts the game loop.
   *
   * @returns true if the game was started successfully
   */
  start(): boolean {
    if (!this.game) return false;
    if (!this.state.transitionTo(State.IN_GAME)) return false;

    this.game.startGame();
    this.broadcastSnapshot();
    return true;
  }

  /**
   * Pause the game.
   *
   * Transitions from IN_GAME to READY state.
   *
   * @returns true if the game was paused successfully
   */
  pause(): boolean {
    if (!this.game) return false;
    if (!this.state.transitionTo(State.READY)) return false;

    this.game.pauseGame();
    this.broadcastSnapshot();
    return true;
  }

  /**
   * End the game.
   *
   * Transitions from IN_GAME to ENDED state.
   *
   * @returns true if the game was ended successfully
   */
  end(): boolean {
    if (!this.game) return false;
    if (!this.state.transitionTo(State.ENDED)) return false;

    this.game.endGame();
    this.broadcastSnapshot();
    return true;
  }

  /**
   * Reset the room for a new game.
   *
   * Transitions from ENDED to OPEN state and reinitializes the game.
   *
   * @returns true if the reset was successful
   */
  reset(): boolean {
    const ok = this.state.transitionTo(State.OPEN);
    if (ok && this.game) {
      this.game.init();
      this.broadcastSnapshot();
    }
    return ok;
  }

  // ===========================================================================
  // SUBSCRIPTION MANAGEMENT
  // ===========================================================================

  /**
   * Subscribe a listener to receive room broadcasts.
   *
   * @param listener - Callback that receives broadcast messages
   */
  subscribe(listener: (data: string) => void): void {
    if (!this.broadcaster) return;
    this.broadcaster.addListener(this.id, listener);
  }

  /**
   * Unsubscribe a listener from room broadcasts.
   *
   * @param listener - The same callback passed to subscribe()
   */
  unsubscribe(listener: (data: string) => void): void {
    if (!this.broadcaster) return;
    this.broadcaster.removeListener(this.id, listener);
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  /**
   * Broadcast the current game snapshot to all subscribers.
   */
  private broadcastSnapshot(): void {
    if (!this.broadcaster || !this.game) return;

    const payload = {
      roomId: this.id,
      state: this.state.current,
      gameType: this.game.type,
      snapshot: this.game.Snapshot,
      event: "snapshot",
    };

    this.broadcaster.broadcast(this.id, JSON.stringify(payload));
  }
}
