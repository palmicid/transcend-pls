import { NextRequest, NextResponse } from "next/server";
import { createSSEHandler } from "@/lib/sse/createSSEHandler";
import { verifySSEToken } from "@/lib/auth/sse-token";
import { roomManager } from "@/lib/rooms";
import { broadcaster } from "@/lib/broadcast";
import prisma from "@/lib/prisma";
import TicTacToeGame from "../../lib/TicTacToeGame";

/**
 * Ensure room is loaded in memory, hydrating from DB if necessary.
 */
async function getOrLoadRoom(roomId: string) {
  let room = roomManager.getRoom(roomId);
  if (room) return room;

  // Hydrate from DB
  const dbRoom = await prisma.room.findUnique({
    where: { id: roomId },
  });

  if (!dbRoom) return null;

  const game = new TicTacToeGame();
  game.init();
  game.restoreState(dbRoom);

  room = roomManager.attachGame(
    dbRoom.id,
    game,
    broadcaster,
    dbRoom.owner_id.toString()
  );

  return room;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");

  if (!token) {
    return new NextResponse("Missing token", { status: 401 });
  }

  const payload = await verifySSEToken(token);
  if (!payload || payload.roomId !== roomId) {
    return new NextResponse("Invalid token", { status: 401 });
  }

  const room = await getOrLoadRoom(roomId);
  if (!room) {
    return new NextResponse("Room not found", { status: 404 });
  }

  return createSSEHandler({
    onInit: (send) => {
      // Send initial snapshot
      const snapshot = room.getSnapshot();
      send({
        event: "snapshot",
        data: {
          roomId,
          state: room.status,
          gameType: room.gameType,
          snapshot,
        },
      });
    },
    onSubscribe: (send) => {
      const listener = (data: string) => {
        // Room broadcasts a JSON string, we relay it directly
        send({ data });
      };

      room.subscribe(listener);
      return () => room.unsubscribe(listener);
    },
  });
}
