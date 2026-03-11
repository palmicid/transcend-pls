"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoomInfo } from "@/types/game";
import { ArrowLeft, Plus, RefreshCw, Trash2, Users, LogIn } from "lucide-react";
import Link from "next/link";

interface GameLobbyProps {
	gameId: string;
	userId: string;
	displayName: string;
	actions: {
		listRooms: () => Promise<RoomInfo[]>;
		createRoom: (
			roomId?: string,
		) => Promise<{ ok: boolean; roomId?: string; error?: string }>;
		deleteRoom: (roomId: string, userId: string) => Promise<{ ok: boolean }>;
	};
	metadata: {
		name: string;
		description: string;
		urlSlug: string;
	};
}

export default function GameLobby({
	gameId,
	userId,
	displayName,
	actions,
	metadata,
}: GameLobbyProps) {
	const router = useRouter();
	const [rooms, setRooms] = useState<RoomInfo[]>([]);
	const [newRoomId, setNewRoomId] = useState("");
	const [loading, setLoading] = useState(false);

	const loadRooms = async () => {
		const roomList = await actions.listRooms();
		setRooms(roomList);
	};

	useEffect(() => {
		loadRooms();
	}, []);

	const handleCreateRoom = async () => {
		const roomIdToCreate =
			newRoomId.trim() || `room-${Math.random().toString(36).substring(2, 9)}`;

		setLoading(true);
		try {
			const result = await actions.createRoom(roomIdToCreate);
			if (result.ok && result.roomId) {
				setNewRoomId("");
				await loadRooms();
				// Optional: Auto-join?
			} else {
				alert(result.error || "Failed to create room");
			}
		} catch (error) {
			console.error("Failed to create room:", error);
			alert("Failed to create room");
		} finally {
			setLoading(false);
		}
	};

	const handleJoinRoom = (room: RoomInfo) => {
		router.push(`/play/${metadata.urlSlug}/${room.id}`);
	};

	const handleDeleteRoom = async (room: RoomInfo) => {
		if (!confirm("Are you sure you want to delete this room?")) return;

		setLoading(true);
		try {
			const { ok } = await actions.deleteRoom(room.id, userId);
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
							{metadata.name} Lobby
						</h1>
						<p className="text-sm text-white/60">{metadata.description}</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
						Playing as:{" "}
						<span className="font-semibold text-cyan-300">{displayName}</span>
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
						{/* Room Name Input */}
						{/* (Simplified for brevity, can match TTT lobby exact styling) */}
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

						<button
							onClick={handleCreateRoom}
							disabled={loading}
							className="w-full rounded-2xl bg-white px-4 py-3 font-semibold text-zinc-950 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
						>
							{loading ? "Creating..." : "Create Room"}
						</button>
					</div>
				</div>

				{/* Rooms List */}
				<div className="lg:col-span-2">
					<div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-lg font-semibold flex items-center gap-2">
								<Users className="h-5 w-5 text-cyan-400" />
								Available Rooms
							</h2>
							<button
								onClick={loadRooms}
								className="rounded-xl border border-white/10 bg-white/5 p-2 hover:bg-white/15 transition"
							>
								<RefreshCw className="h-4 w-4" />
							</button>
						</div>

						<div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
							{rooms.length === 0 ? (
								<div className="text-center py-12 text-white/50">
									<p>No rooms available</p>
								</div>
							) : (
								rooms.map((room) => {
									const isOwner = room.owner?.id.toString() === userId;
									const isOpen = room.status === "OPEN";
									return (
										<div
											key={room.id}
											className={`flex items-center justify-between p-4 rounded-2xl border transition group ${
												isOpen
													? "border-green-500/50 bg-gradient-to-r from-green-500/15 to-green-500/5 hover:from-green-500/25 hover:to-green-500/10"
													: "border-white/10 bg-white/[0.02] hover:bg-white/[0.06]"
											}`}
										>
											<div className="min-w-0 flex-1">
												<div
													className={`font-medium truncate ${isOpen ? "text-green-100" : "text-white"}`}
												>
													Room {room.id}
												</div>
												<div className="text-xs text-white/50 mt-1 flex gap-4">
													<span>
														Players: {room.playerCount}/{room.maxPlayers}
													</span>
													<span>Status: {room.status}</span>
												</div>
											</div>

											<div className="flex gap-2 ml-4">
												{isOwner && (
													<button
														onClick={() => handleDeleteRoom(room)}
														className="rounded-xl border border-red-500/30 bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20"
													>
														<Trash2 className="h-4 w-4" />
													</button>
												)}
												<button
													onClick={() => handleJoinRoom(room)}
													className={`rounded-xl border px-4 py-2 text-sm font-medium transition flex items-center gap-2 ${
														isOpen
															? "border-green-400/50 bg-green-500/20 text-green-200 hover:bg-green-500/30"
															: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20"
													}`}
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
