/**
 * @file lib/rooms/loadAndValidateRoom.ts
 * @description Load and validate room state from database with consistency checks.
 *
 * This utility ensures that database room state is consistent before hydrating
 * the in-memory room. It validates:
 * - Player count matches room configuration
 * - Player roles are valid and consistent
 * - Board state is consistent with player count
 * - Game status transitions are valid
 */

import prisma from "@/lib/prisma";
import { broadcaster } from "@/lib/broadcast";
import TicTacToeGame from "@/app/play/tic-tac-toe/lib/TicTacToeGame";
import { PlayerRole } from "@/app/play/tic-tac-toe/lib/TicTacToePlayerSlot";
import Room from "@/lib/rooms/Room";
import type RoomManager from "@/lib/rooms/RoomManager";

// Use dynamic import to avoid circular dependency
let roomManager: InstanceType<typeof RoomManager> | null = null;

async function getRoomManager() {
  if (!roomManager) {
    const { roomManager: rm } = await import("@/lib/rooms/RoomManager");
    roomManager = rm;
  }
  return roomManager;
}

// =============================================================================
// TYPES
// =============================================================================

export interface DatabaseRoom {
  id: string;
  game_type: string;
  status: string;
  owner_id: number;
  max_players: number;
  board_state: (string | null)[] | null;
  current_turn: string | null;
  winner_role: string | null;
  players: Array<{
    user_id: number;
    role: string | null;
  }>;
}

export interface RoomValidationError {
  code:
    | "INVALID_PLAYER_COUNT"
    | "INVALID_PLAYER_ROLE"
    | "INVALID_BOARD_STATE"
    | "INVALID_STATUS_TRANSITION"
    | "INVALID_GAME_TYPE";
  message: string;
  severity: "warning" | "error";
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Winning line combinations on a 3x3 board.
 * Each array contains the indices of a winning line.
 */
const WINNING_LINES = [
  [0, 1, 2], // Top row
  [3, 4, 5], // Middle row
  [6, 7, 8], // Bottom row
  [0, 3, 6], // Left column
  [1, 4, 7], // Middle column
  [2, 5, 8], // Right column
  [0, 4, 8], // Diagonal top-left to bottom-right
  [2, 4, 6], // Diagonal top-right to bottom-left
];

/**
 * Check if there's a winner on the board based on winning patterns.
 *
 * @param board - The board state (array of 9 cells)
 * @returns The winning player role ("X" or "O"), or null if no winner
 */
function checkBoardWinner(board: (string | null)[]): string | null {
  for (const [a, b, c] of WINNING_LINES) {
    const player = board[a];
    if (player && board[b] === player && board[c] === player) {
      return player;
    }
  }
  return null;
}

/**
 * Validate loaded room state for consistency.
 *
 * @returns Array of validation errors (empty if valid). If any error has
 *          severity "error", the room should not be loaded.
 */
function validateRoomState(dbRoom: DatabaseRoom): RoomValidationError[] {
  const errors: RoomValidationError[] = [];

  // Validate game type
  if (dbRoom.game_type !== "tic-tac-toe") {
    errors.push({
      code: "INVALID_GAME_TYPE",
      message: `Unsupported game type: ${dbRoom.game_type}`,
      severity: "error",
    });
    return errors; // Can't validate further without knowing game type
  }

  // Validate player count
  if (dbRoom.players.length > dbRoom.max_players) {
    errors.push({
      code: "INVALID_PLAYER_COUNT",
      message: `Player count (${dbRoom.players.length}) exceeds max (${dbRoom.max_players})`,
      severity: "error",
    });
  }

  // Validate player roles (only X and O for tic-tac-toe)
  const validRoles = new Set(["X", "O", null]);
  const assignedRoles = new Set<string>();

  for (const player of dbRoom.players) {
    if (!validRoles.has(player.role)) {
      errors.push({
        code: "INVALID_PLAYER_ROLE",
        message: `Invalid player role: ${player.role}`,
        severity: "error",
      });
    }
    if (player.role && assignedRoles.has(player.role)) {
      errors.push({
        code: "INVALID_PLAYER_ROLE",
        message: `Duplicate role assignment: ${player.role}`,
        severity: "error",
      });
    }
    if (player.role) assignedRoles.add(player.role);
  }

  // Validate board state
  const board = (dbRoom.board_state as (string | null)[]) || Array(9).fill(null);
  if (!Array.isArray(board) || board.length !== 9) {
    errors.push({
      code: "INVALID_BOARD_STATE",
      message: `Board state is not a valid 3x3 grid`,
      severity: "error",
    });
  } else {
    // Count X and O on the board
    const boardXCount = board.filter((c) => c === "X").length;
    const boardOCount = board.filter((c) => c === "O").length;

    // X should move first, so X count >= O count, but not more than 1 ahead
    if (boardXCount < boardOCount || boardXCount > boardOCount + 1) {
      errors.push({
        code: "INVALID_BOARD_STATE",
        message: `Invalid board state: X (${boardXCount}) and O (${boardOCount}) counts are inconsistent`,
        severity: "error",
      });
    }

    // Validate current_turn is consistent with board state
    if (
      dbRoom.status === "IN_GAME" &&
      dbRoom.current_turn &&
      !["X", "O"].includes(dbRoom.current_turn)
    ) {
      errors.push({
        code: "INVALID_BOARD_STATE",
        message: `Invalid current_turn: ${dbRoom.current_turn}`,
        severity: "error",
      });
    }
  }

  // Validate status transitions
  const validStatuses = ["OPEN", "READY", "IN_GAME", "ENDED"];
  if (!validStatuses.includes(dbRoom.status)) {
    errors.push({
      code: "INVALID_STATUS_TRANSITION",
      message: `Invalid room status: ${dbRoom.status}`,
      severity: "error",
    });
  }

  // Warn if status is READY but players < max_players
  if (dbRoom.status === "READY" && dbRoom.players.length < dbRoom.max_players) {
    errors.push({
      code: "INVALID_STATUS_TRANSITION",
      message: `Room is READY but has fewer players (${dbRoom.players.length}) than max (${dbRoom.max_players})`,
      severity: "warning",
    });
  }

  // Validate winner consistency with board state
  const boardWinner = checkBoardWinner(board);
  const isDraw = board.every((c) => c !== null) && !boardWinner;

  // Check if there's a winning pattern on the board but no winner_role is set
  if (boardWinner && !dbRoom.winner_role) {
    errors.push({
      code: "INVALID_BOARD_STATE",
      message: `Board shows a winning pattern for ${boardWinner} but winner_role is not set`,
      severity: "error",
    });
  }

  // Check if winner_role is set but doesn't match the actual winner on the board
  if (dbRoom.winner_role && boardWinner && dbRoom.winner_role !== boardWinner) {
    errors.push({
      code: "INVALID_BOARD_STATE",
      message: `winner_role is ${dbRoom.winner_role} but board shows ${boardWinner} as the winner`,
      severity: "error",
    });
  }

  // Check if winner_role is set but there's no winning pattern on the board
  if (dbRoom.winner_role && !boardWinner && !isDraw) {
    errors.push({
      code: "INVALID_BOARD_STATE",
      message: `winner_role is set to ${dbRoom.winner_role} but there's no winning pattern on the board`,
      severity: "error",
    });
  }

  // Warn if status is ENDED but has no winner and not a draw
  if (dbRoom.status === "ENDED") {
    if (!dbRoom.winner_role && !isDraw) {
      errors.push({
        code: "INVALID_STATUS_TRANSITION",
        message: `Room is ENDED but has no winner and is not a draw`,
        severity: "warning",
      });
    }
  }

  return errors;
}

// =============================================================================
// LOADING
// =============================================================================

/**
 * Load a room from the database and validate its state before creating
 * the in-memory Room object.
 *
 * @param roomId - The room ID to load
 * @returns In-memory Room object if found and valid, null otherwise
 * @throws Error if room has validation errors with severity "error"
 */
export async function loadAndValidateRoom(roomId: string): Promise<Room | null> {
  const rm = await getRoomManager();

  // Check if room is already in memory
  let room = rm.getRoom(roomId);
  if (room) return room;

  // Load room from database
  const dbRoom = await prisma.room.findUnique({
    where: { id: roomId },
    include: { players: true },
  });

  if (!dbRoom) return null;

  // Validate room state
  const validationErrors = validateRoomState(
    dbRoom as unknown as DatabaseRoom
  );

  // Log validation warnings
  const warnings = validationErrors.filter((e) => e.severity === "warning");
  if (warnings.length > 0) {
    console.warn(`[Room] Validation warnings for room ${roomId}:`, warnings);
  }

  // Throw on validation errors
  const errors = validationErrors.filter((e) => e.severity === "error");
  if (errors.length > 0) {
    console.error(`[Room] Validation errors for room ${roomId}:`, errors);
    throw new Error(
      `Room ${roomId} failed validation: ${errors.map((e) => e.message).join("; ")}`
    );
  }

  // Hydrate in-memory game from database state
  const game = new TicTacToeGame();
  game.init();
  game.restoreState(dbRoom);

  // Restore player slots from Prisma data
  for (const player of dbRoom.players) {
    if (player.role === "X" || player.role === "O") {
      game.playerslot.roles[player.role as PlayerRole] = player.user_id.toString();
    }
  }

  // Attach game to room manager
  room = rm.attachGame(
    dbRoom.id,
    game,
    broadcaster,
    dbRoom.owner_id.toString()
  );

  return room;
}

/**
 * Load a room with error handling. Returns null instead of throwing on
 * validation errors, but logs them.
 *
 * Useful when you want to gracefully handle invalid rooms without crashing.
 */
export async function loadAndValidateRoomSafe(
  roomId: string
): Promise<Room | null> {
  try {
    return await loadAndValidateRoom(roomId);
  } catch (error) {
    console.error(`[Room] Failed to load room ${roomId}:`, error);
    return null;
  }
}
