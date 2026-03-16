"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RoomInfo } from "@/types/game";
import GameLobby from "@/components/game/lobby/GameLobby";
import { listLobbyRooms, deleteLobbyRoom } from "@/app/play/actions";
import { joinMatchmakingQueue, leaveMatchmakingQueue } from "@/app/play/matchmaking-actions";

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
  const [isSearching, setIsSearching] = useState(false);
  const [queueLoading, setQueueLoading] = useState(false);

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

    // Safety cleanup for matchmaking on unmount
    return () => {
      if (isSearching) {
        leaveMatchmakingQueue(gameId).catch(console.error);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, isSearching]);

  const handleJoinQueue = async () => {
    if (queueLoading) return;
    setQueueLoading(true);
    try {
      setIsSearching(true);
      const { ok, error } = await joinMatchmakingQueue(gameId);
      if (!ok) {
        alert(error || "Failed to join queue");
        setIsSearching(false);
      }
    } finally {
      setQueueLoading(false);
    }
  };

  const handleLeaveQueue = async () => {
    if (queueLoading) return;
    setQueueLoading(true);
    try {
      await leaveMatchmakingQueue(gameId);
    } finally {
      setIsSearching(false);
      setQueueLoading(false);
    }
  };

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
      if (isSearching) await handleLeaveQueue();
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
      loading={loading || queueLoading}
      actions={{
        onJoinQueue: handleJoinQueue,
        onLeaveQueue: handleLeaveQueue,
        isSearching,
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
