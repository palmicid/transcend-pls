"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listAllRooms, deleteLobbyRoom, createTicTacToeRoom, type RoomInfo } from "./actions";
import { logoutUser } from "@/app/auth/actions";
import { ArrowLeft, Plus, RefreshCw, Trash2, Users, LogIn } from "lucide-react";
import Link from "next/link";

interface LobbyContentProps {
  userId: string;
}

export default function LobbyContent({ userId }: LobbyContentProps) {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [newRoomId, setNewRoomId] = useState("");
  const [loading, setLoading] = useState(false);

  const loadRooms = async () => {
    const roomList = await listAllRooms();
    setRooms(roomList);
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const handleCreateRoom = async () => {
    const roomIdToCreate = newRoomId.trim() || `room-${Math.random().toString(36).substring(2, 9)}`;

    setLoading(true);
    try {
      await createTicTacToeRoom(roomIdToCreate, userId);
      setNewRoomId("");
      await loadRooms();
    } catch (error) {
      console.error("Failed to create room:", error);
      alert("Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = (room: RoomInfo) => {
    // Navigate to room - joining happens automatically via SSE connection
    router.push(`/play/tic-tac-toe/${room.id}`);
  };

  const handleDeleteRoom = async (room: RoomInfo) => {
    setLoading(true);
    try {
      const { ok } = await deleteLobbyRoom(room.id, userId);
      if (!ok) {
        alert("Only the room owner can delete this room");
      }
      await loadRooms();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/play"
            className="rounded-2xl border border-white/10 bg-white/5 p-2 hover:bg-white/15 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Tic–Tac–Toe Lobby
            </h1>
            <p className="text-sm text-white/60">
              Create or join a room to play
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            Playing as: <span className="font-semibold text-cyan-300">{userId}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Room Panel */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-cyan-400" />
            Create Room
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Room Name
              </label>
              <input
                type="text"
                placeholder="Leave empty to auto-generate"
                value={newRoomId}
                onChange={(e) => setNewRoomId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/30 transition"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Game Type
              </label>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/50">
                Tic-Tac-Toe
              </div>
            </div>

            <button
              onClick={handleCreateRoom}
              disabled={loading}
              className="w-full rounded-2xl bg-white px-4 py-3 font-semibold text-zinc-950 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading
                ? "Creating..."
                : newRoomId.trim()
                ? `Create "${newRoomId}"`
                : "Create Room"}
            </button>
          </div>
        </div>

        {/* Rooms List */}
        <div className="lg:col-span-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-cyan-400" />
                  Available Rooms
                </h2>
                <p className="text-xs text-white/50 mt-1">
                  Click a room to join
                </p>
              </div>
              <button
                onClick={loadRooms}
                className="rounded-xl border border-white/10 bg-white/5 p-2 hover:bg-white/15 transition"
                title="Refresh rooms"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
              {rooms.length === 0 ? (
                <div className="text-center py-12 text-white/50">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No rooms available</p>
                  <p className="text-sm mt-1">Create one to get started!</p>
                </div>
              ) : (
                rooms.map((room) => {
                  const isOwner = room.owner?.id.toString() === userId;
                  return (
                    <div
                      key={room.id}
                      className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] transition group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate text-white">
                          Room {room.id.slice(0, 8)}
                        </div>
                        <div className="text-xs text-white/50 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                          <span>
                            Players:{" "}
                            <span className="font-semibold text-cyan-300">
                              {room.playerCount}/{room.max_players}
                            </span>
                          </span>
                          <span>
                            Status:{" "}
                            <span className={`font-semibold ${
                              room.status === "IN_GAME"
                                ? "text-amber-300"
                                : room.status === "READY"
                                ? "text-emerald-300"
                                : "text-white/70"
                            }`}>
                              {room.status}
                            </span>
                          </span>
                          <span>
                            Owner:{" "}
                            <span className="font-semibold text-white/70">
                              {room.owner?.display_name ?? "Unknown"}
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {isOwner && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRoom(room);
                            }}
                            disabled={loading}
                            className="rounded-xl border border-red-500/30 bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20 transition disabled:opacity-50"
                            title="Delete room"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleJoinRoom(room)}
                          disabled={loading}
                          className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 hover:bg-cyan-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <LogIn className="h-4 w-4" />
                          Join
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
