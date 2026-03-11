/**
 * @file app/api/room/all/route.ts
 * @description List all game rooms (public endpoint).
 *
 * Returns room metadata including owner info and player count.
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      select: {
        id: true,
        name: true,
        game_type: true,
        status: true,
        max_players: true,
        current_turn: true,
        created_at: true,
        owner: {
          select: {
            id: true,
            display_name: true,
          },
        },
        players: {
          select: {
            user_id: true,
            role: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    // Transform to include player count
    const roomsWithCount = rooms.map((room: typeof rooms[number]) => ({
      ...room,
      playerCount: room.players.length,
    }));

    return NextResponse.json({ rooms: roomsWithCount });
  } catch (error) {
    console.error("Failed to list rooms:", error);
    return NextResponse.json(
      { error: "Failed to list rooms" },
      { status: 500 }
    );
  }
}
