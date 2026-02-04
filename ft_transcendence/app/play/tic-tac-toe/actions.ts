/**
 * @file app/play/tic-tac-toe/actions.ts
 */

"use server";

import { createGameRoom, submitGameMove, startGame } from "@/lib/game/gameActions";

export const createTicTacToeRoom = async () => await createGameRoom("tic-tac-toe");
export const submitTicTacToeMove = async (roomId: string, userId: string, cell: number) =>
  await submitGameMove(roomId, { cell }, "tic-tac-toe");
export const startTicTacToeGame = async (roomId: string) => await startGame(roomId, "tic-tac-toe");
