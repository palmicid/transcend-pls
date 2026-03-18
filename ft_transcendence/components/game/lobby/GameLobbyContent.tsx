"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RoomInfo } from "@/types/game";
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
  onPlayBot: (difficulty: string) => Promise<void>;
}

export default function GameLobbyContent({
  gameId,
  userId,
  metadata,
  createRoom,
  onPlayBot,
}: GameLobbyContentProps) {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const roomList = await listLobbyRooms(gameId);
      setRooms(roomList);
    } catch (err) {
      console.error("Failed to load rooms:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  const handleJoinRoom = (roomId: string) => {
    router.push(`/play/${metadata.urlSlug}/${roomId}`);
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    try {
      const { ok } = await deleteLobbyRoom(roomId, userId);
      if (ok) {
        await loadRooms();
      } else {
        alert("Action restricted to room owner");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleCreateRoom = async (roomId: string) => {
    try {
      const result = await createRoom(roomId);
      if (result.ok && result.roomId) {
        await loadRooms();
        router.push(`/play/${metadata.urlSlug}/${result.roomId}`);
      } else {
        alert(result.error || "Failed to create room");
      }
    } catch (err) {
      console.error("Create room error:", err);
    }
  };

  const handlePlayBot = async (difficulty: string) => {
    setLoading(true);
    try {
      await onPlayBot(difficulty);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GameLobby
      gameType={gameId}
      userId={userId}
      rooms={rooms}
      loading={loading}
      actions={{
        onRefresh: loadRooms,
        onJoinRoom: handleJoinRoom,
        onCreateRoom: handleCreateRoom,
        onPlayBot: handlePlayBot,
        onDeleteRoom: handleDeleteRoom,
      }}
      metadata={metadata}
    />
  );
}
