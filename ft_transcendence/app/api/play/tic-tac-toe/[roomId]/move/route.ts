/**
 * @file app/api/play/tic-tac-toe/[roomId]/move/route.ts
 * @description Handle Tic-Tac-Toe game moves (authenticated).
 *
 * Validates the move, updates Prisma, and broadcasts via Express.
 * Works even if Express is down (circuit breaker pattern).
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/auth-session";
import { generateSSEToken } from "@/lib/auth/sse-token";
import { expressClient } from "@/lib/resilience";
import { roomManager } from "@/lib/rooms";

type RouteContext = {
  params: Promise<{ roomId: string }>;
};

/**
 * POST /api/play/tic-tac-toe/[roomId]/move - Submit a Tic-Tac-Toe move
 *
 * Validates the move, updates the database, and broadcasts to Express.
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await context.params;
    const body = await req.json().catch(() => ({}));
    const { cell } = body as { cell?: number };

    if (typeof cell !== "number" || cell < 0 || cell > 8) {
      return NextResponse.json({ error: "Invalid cell" }, { status: 400 });
    }

    // Get room with players
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { players: true },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Verify this is a Tic-Tac-Toe room
    if (room.game_type !== "tic-tac-toe") {
      return NextResponse.json(
        { error: "Not a Tic-Tac-Toe room" },
        { status: 400 }
      );
    }

    // Verify player is in room
    const player = room.players.find(
      (p: { user_id: number; role: string | null }) =>
        p.user_id === session.userId
    );
    if (!player) {
      return NextResponse.json({ error: "Not in room" }, { status: 403 });
    }

    // Verify game is in progress
    if (room.status !== "IN_GAME" && room.status !== "READY") {
      // Auto-start if ready
      if (room.status === "READY") {
        await prisma.room.update({
          where: { id: roomId },
          data: { status: "IN_GAME" },
        });
      } else {
        return NextResponse.json(
          { error: "Game not in progress" },
          { status: 400 }
        );
      }
    }

    // Validate it's this player's turn
    if (player.role !== room.current_turn) {
      return NextResponse.json({ error: "Not your turn" }, { status: 400 });
    }

    // Validate move
    const board = (room.board_state as (string | null)[] | null)
      ? (room.board_state as (string | null)[])
      : Array(9).fill(null);
    if (board[cell] !== null) {
      return NextResponse.json({ error: "Cell occupied" }, { status: 400 });
    }

    // Apply move
    board[cell] = player.role;

    // Check for winner
    const winner = checkWinner(board);
    const isDraw = !winner && board.every((c) => c !== null);
    const nextTurn = player.role === "X" ? "O" : "X";

    // Update database
    await prisma.room.update({
      where: { id: roomId },
      data: {
        board_state: board,
        current_turn: winner || isDraw ? null : nextTurn,
        winner_role: winner,
        status: winner || isDraw ? "ENDED" : "IN_GAME",
      },
    });

    // Sync with in-memory room manager
    roomManager.submitAction(roomId, session.userId.toString(), { cell });

    // Try to broadcast via Express (may fail silently)
    const token = await generateSSEToken(roomId, session.userId);
    const broadcasted = await expressClient.broadcast(
      roomId,
      {
        event: "MOVE",
        board,
        current_turn: winner || isDraw ? null : nextTurn,
        winner: winner,
        is_draw: isDraw,
      },
      token
    );

    return NextResponse.json({
      ok: true,
      board,
      current_turn: winner || isDraw ? null : nextTurn,
      winner,
      is_draw: isDraw,
      realtime: broadcasted,
    });
  } catch (error) {
    console.error("Failed to process move:", error);
    return NextResponse.json(
      { error: "Failed to process move" },
      { status: 500 }
    );
  }
}

/**
 * Check for a Tic-Tac-Toe winner.
 */
function checkWinner(board: (string | null)[]): string | null {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // columns
    [0, 4, 8],
    [2, 4, 6], // diagonals
  ];

  for (const [a, b, c] of lines) {
    if (
      board[a] &&
      board[a] === board[b] &&
      board[a] === board[c]
    ) {
      return board[a];
    }
  }
  return null;
}
