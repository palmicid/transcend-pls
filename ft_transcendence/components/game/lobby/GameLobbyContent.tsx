"use client";

import GameLobby from "@/components/game/lobby/GameLobby";
import { listLobbyRooms, deleteLobbyRoom } from "@/app/play/actions";

interface LobbyMetadata {
  name: string;
  description: string;
  urlSlug: string;
}

interface GameLobbyContentProps {
  gameId: string;
  userId: string;
  displayName: string;
  metadata: LobbyMetadata;
  createRoom: (
    roomId?: string,
  ) => Promise<{ ok: boolean; roomId?: string; error?: string }>;
}

export default function GameLobbyContent({
  gameId,
  userId,
  displayName,
  metadata,
  createRoom,
}: GameLobbyContentProps) {
  return (
    <GameLobby
      gameId={gameId}
      userId={userId}
      displayName={displayName}
      actions={{
        listRooms: () => listLobbyRooms(gameId),
        createRoom,
        deleteRoom: deleteLobbyRoom,
      }}
      metadata={metadata}
    />
  );
}
