/**
 * @file app/play/connect4/actions.ts
 */

"use server";

import { createGameRoom, submitGameMove, startGame } from "@/lib/game/gameActions";

export const createConnect4Room = async () => await createGameRoom("connect4");
export const submitConnect4Move = async (roomId: string, userId: string, column: number) =>
  await submitGameMove(roomId, { column }, "connect4");
export const startConnect4Game = async (roomId: string) => await startGame(roomId, "connect4");
