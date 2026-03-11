/**
 * @file app/api/play/tic-tac-toe/sse/[roomId]/route.ts
 */

import { createGameSSERouteHandler } from "@/lib/sse/createGameSSEHandler";

export const GET = createGameSSERouteHandler("tic-tac-toe");
