"use client";

import GameLobby from "@/components/game/lobby/GameLobby";
import {
  listLobbyRooms,
  deleteLobbyRoom
} from "@/app/play/actions";
import { createConnect4Room } from "./actions";

export default function LobbyContent({ userId }: { userId: string }) {
  return (
    <GameLobby
      gameId="connect4"
      userId={userId}
      actions={{
        listRooms: () => listLobbyRooms("connect4"),
        createRoom: createConnect4Room,
        deleteRoom: deleteLobbyRoom,
      }}
      metadata={{
        name: "Connect 4",
        description: "Drop discs to connect 4 in any direction!",
        urlSlug: "connect4"
      }}
    />
  );
}
