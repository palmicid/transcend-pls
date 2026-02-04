/**
 * @file app/play/connect4/sse/[roomId]/route.ts
 */

import { createGameSSERouteHandler } from "@/lib/sse/createGameSSEHandler";

export const GET = createGameSSERouteHandler("connect4");
