"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listAllRooms, joinLobbyRoom, deleteLobbyRoom } from "./actions";
import { createTicTacToeRoom, joinTicTacToeRoom } from "../game/tic-tac-toe/actions";
import { logoutUser } from "../auth/actions";

type RoomInfo = {
  id: string;
  state: string | null;
  gameType: string | null;
  ownerId: string | null;
  playerCount: number;
};



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
    const interval = setInterval(loadRooms, 3000); // Refresh every 3s
    return () => clearInterval(interval);
  }, []);

  const handleCreateRoom = async () => {
    // If input is empty, generate a random ID
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

  const handleJoinRoom = async (room: RoomInfo) => {
    setLoading(true);
    const gameType = room.gameType === "tic-tac-toe" ? "tic-tac-toe" : "generic";

    try {
      if (gameType === "tic-tac-toe") {
        await joinTicTacToeRoom(room.id, userId);
      } else {
        // Fallback for any legacy rooms
        await joinLobbyRoom(room.id, userId);
      }

      // Always redirect to the room page
      router.push(`/lobby/${room.id}`);
    } catch (error) {
      console.error("Failed to join room:", error);
      alert("Failed to join room");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
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
    <div className="min-h-screen bg-[#1e1e2e] text-[#cdd6f4] p-8">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-[#a6e3a1]">Game Lobby</h1>
          <div className="px-3 py-1 rounded-full bg-[#313244] border border-[#45475a]">
            <span className="text-sm text-[#7f849c]">Logged in as: </span>
            <span className="text-sm font-semibold text-[#89b4fa]">{userId}</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-md bg-[#f38ba8] hover:bg-[#eba0ac] text-[#1e1e2e] text-sm font-medium transition"
        >
          Logout
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Room */}
        <div className="space-y-6">
          <div className="bg-[#313244] rounded-lg shadow-lg p-6 border border-[#45475a]">
            <h2 className="text-2xl font-semibold mb-4 text-[#a6e3a1]">Create Room</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#cba6f7] mb-1">
                  Room ID
                </label>
                <input
                  type="text"
                  placeholder="Leave empty to auto-generate"
                  value={newRoomId}
                  onChange={(e) => setNewRoomId(e.target.value)}
                  className="w-full bg-[#1e1e2e] border border-[#45475a] rounded-md p-2 text-sm text-[#cdd6f4] placeholder-[#6c7086] focus:border-[#89dceb] focus:outline-none transition"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#cba6f7] mb-1">
                  Game Type
                </label>
                <div className="w-full bg-[#1e1e2e] border border-[#45475a] rounded-md p-2 text-sm text-[#cdd6f4] opacity-70 cursor-not-allowed">
                  Tic-Tac-Toe
                </div>
              </div>

              <button
                onClick={handleCreateRoom}
                disabled={loading}
                className="w-full bg-[#89b4fa] hover:bg-[#74c7ec] text-[#1e1e2e] px-4 py-2 rounded-md disabled:bg-[#6c7086] disabled:text-[#a6adc8] text-sm font-medium transition"
              >
                {loading
                  ? "Creating..."
                  : newRoomId.trim()
                  ? `Create a new room with custom ID: ${newRoomId}`
                  : "Auto-generate Room ID"}
              </button>
            </div>
          </div>
        </div>

        {/* Rooms List */}
        <div className="lg:col-span-2">
          <div className="bg-[#313244] rounded-lg shadow-lg p-6 border border-[#45475a]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-xl font-semibold text-[#a6e3a1]">Rooms</h2>
                <p className="text-xs text-[#7f849c]">Join redirects to the room page where SSE stays open.</p>
              </div>
              <button
                onClick={loadRooms}
                className="text-xs text-[#89dceb] hover:text-[#74c7ec] transition"
              >
                Refresh
              </button>
            </div>

            <div className="space-y-2 max-h-[32rem] overflow-y-auto">
              {rooms.length === 0 ? (
                <p className="text-[#6c7086] text-sm text-center py-4">No rooms</p>
              ) : (
                rooms.map((room) => {
                  const isOwner = room.ownerId === userId;
                  return (
                    <div
                      key={room.id}
                      className="flex items-center justify-between p-3 rounded-md border-2 border-[#45475a] bg-[#1e1e2e] hover:border-[#6c7086] transition"
                    >
                      <div className="min-w-0">
                        <div className="font-medium truncate text-[#a6e3a1]">{room.id}</div>
                        <div className="text-xs text-[#7f849c] mt-1 flex gap-3 flex-wrap">
                          <span>Players: <span className="font-semibold text-[#f9e2af]">{room.playerCount}/2</span></span>
                          <span>State: <span className="font-semibold text-[#cba6f7]">{room.state}</span></span>
                          <span>Game: <span className="font-semibold text-[#89b4fa]">{room.gameType ?? "generic"}</span></span>
                          <span>Owner: <span className="font-semibold text-[#a6e3a1]">{room.ownerId ?? "n/a"}</span></span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {isOwner && (
                          <button
                            onClick={() => handleDeleteRoom(room)}
                            disabled={loading}
                            className="px-3 py-2 rounded-md bg-[#f38ba8] hover:bg-[#eba0ac] text-[#1e1e2e] text-xs font-semibold transition disabled:opacity-50"
                          >
                            Delete
                          </button>
                        )}
                        <button
                          onClick={() => handleJoinRoom(room)}
                          disabled={loading}
                          className="px-4 py-2 rounded-md bg-[#a6e3a1] hover:bg-[#94e2d5] text-[#1e1e2e] text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
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
