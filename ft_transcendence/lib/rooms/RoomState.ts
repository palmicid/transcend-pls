/**
 * @file RoomState.ts
 * @description Finite state machine for room lifecycle management.
 *
 * Rooms progress through a linear sequence of states:
 * ```
 * OPEN → READY → IN_GAME → ENDED → OPEN (reset)
 * ```
 *
 * This state machine ensures that rooms can only transition between valid
 * states, preventing bugs like starting a game that's already ended.
 *
 * @example
 * ```ts
 * import { RoomState, State } from '@/lib/rooms';
 *
 * const state = new RoomState();
 * console.log(state.current); // 'OPEN'
 *
 * state.transitionTo(State.READY); // true
 * state.transitionTo(State.OPEN);  // false - can only go to READY from OPEN
 * ```
 */

/**
 * Possible room states in the lifecycle.
 *
 * - **OPEN**: Room is accepting players, game not started
 * - **READY**: All required players present, can start game
 * - **IN_GAME**: Game is actively running
 * - **ENDED**: Game has finished, showing results
 */
export enum State {
  OPEN = "OPEN",
  READY = "READY",
  IN_GAME = "IN_GAME",
  ENDED = "ENDED",
}

/**
 * Valid transitions from each state.
 *
 * This defines the state machine's transition rules:
 * - OPEN can go to READY (when all players join)
 * - READY can go to IN_GAME (start) or OPEN (player left)
 * - IN_GAME can go to ENDED (game over) or READY (paused)
 * - ENDED can go to OPEN (reset for new game)
 */
const VALID_TRANSITIONS: Map<State, State[]> = new Map([
  [State.OPEN, [State.READY]],
  [State.READY, [State.IN_GAME, State.OPEN]],
  [State.IN_GAME, [State.ENDED, State.READY]],
  [State.ENDED, [State.OPEN]],
]);

/**
 * Finite state machine for room lifecycle.
 *
 * Enforces linear transitions between room states to maintain
 * consistency and prevent invalid state changes.
 */
export default class RoomState {
  /** Current state of the room */
  private _state: State = State.OPEN;

  /**
   * Get the current room state.
   */
  get current(): State {
    return this._state;
  }

  /**
   * Check if a transition to the given state is allowed.
   *
   * @param newState - The state to transition to
   * @returns true if the transition is valid
   */
  canTransitionTo(newState: State): boolean {
    const validNextStates = VALID_TRANSITIONS.get(this._state);
    return validNextStates ? validNextStates.includes(newState) : false;
  }

  /**
   * Attempt to transition to a new state.
   *
   * @param newState - The state to transition to
   * @returns true if the transition was successful, false if invalid
   */
  transitionTo(newState: State): boolean {
    if (this.canTransitionTo(newState)) {
      this._state = newState;
      return true;
    }
    return false;
  }
}
