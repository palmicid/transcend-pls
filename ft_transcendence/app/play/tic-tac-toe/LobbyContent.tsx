"use client";

import GameLobby from "@/components/game/lobby/GameLobby";
import {
  listLobbyRooms,
  deleteLobbyRoom
} from "@/app/play/actions";
import { createTicTacToeRoom } from "./actions";

export default function LobbyContent({ userId }: { userId: string }) {
  return (
    <GameLobby
      gameId="tic-tac-toe"
      userId={userId}
      actions={{
        listRooms: () => listLobbyRooms("tic-tac-toe"),
        createRoom: createTicTacToeRoom,
        deleteRoom: deleteLobbyRoom,
      }}
      metadata={{
        name: "Tic-Tac-Toe",
        description: "Classic 3x3 grid game. Get 3 in a row to win!",
        urlSlug: "tic-tac-toe"
      }}
    />
  );
}
