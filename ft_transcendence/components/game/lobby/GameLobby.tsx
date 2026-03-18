"use client";

import { useState } from "react";
import { RoomInfo } from "@/types/game";
import { ArrowLeft, Plus, RefreshCw, Trash2, Users, LogIn, Globe, HelpCircle, Loader2, X } from "lucide-react";
import Link from "next/link";
import { generateRoomId } from "@/lib/utils/roomId";

import PlayVsBotCard from "./PlayVsBotCard";

interface GameLobbyProps {
	gameType: string;
	userId: string;
	rooms: RoomInfo[];
	loading: boolean;
	actions: {
		onRefresh: () => Promise<void>;
		onJoinRoom: (roomId: string) => void;
		onCreateRoom: (roomId: string) => Promise<void>;
		onPlayBot: (difficulty: string) => Promise<void>;
		onDeleteRoom: (roomId: string) => Promise<void>;
	};
	metadata: {
		name: string;
		description: string;
		urlSlug: string;
	};
}

const GAME_RULES: Record<string, { title: string; rules: string[] }> = {
	"tic-tac-toe": {
		title: "How to Play Tic-Tac-Toe",
		rules: [
			"Players take turns placing X or O on a 3×3 grid.",
			"The first player to get 3 of their marks in a row (horizontal, vertical, or diagonal) wins.",
			"If all 9 squares are filled without a winner, it's a draw.",
		],
	},
};

export default function GameLobby({ gameType, userId, rooms, loading, actions, metadata }: GameLobbyProps) {
	const [localLoading, setLocalLoading] = useState(false);
	const [showRulesModal, setShowRulesModal] = useState(false);

	const rules = GAME_RULES[gameType];

	const handleCreateRoom = async () => {
		setLocalLoading(true);
		try {
			const roomId = generateRoomId();
			await actions.onCreateRoom(roomId);
		} catch (error) {
			console.error("Create room error:", error);
		} finally {
			setLocalLoading(false);
		}
	};

	return (
		<div className="space-y-6 sm:space-y-8 pb-10">
			{/* Header */}
			<div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8 overflow-hidden relative">
				<div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
				<div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

				<div className="relative">
					<Link
						href="/play"
						className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition mb-4"
					>
						<ArrowLeft className="h-4 w-4" />
						All Games
					</Link>
					<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
						{metadata.name}
					</h1>
					<p className="mt-2 text-white/70 max-w-2xl">
						{metadata.description}
					</p>
				</div>
			</div>

			<div className="flex justify-end">
				<button
					onClick={() => setShowRulesModal(true)}
					className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 hover:bg-white/[0.06] transition"
				>
					<HelpCircle className="h-4 w-4 text-cyan-400" />
					Rules & Examples
				</button>
			</div>

			{/* CTA Row: Play vs Bot | Create Private Room */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
					<div>
						<PlayVsBotCard
							onPlayBot={actions.onPlayBot}
							loading={loading}
							disabled={false}
						/>
					</div>

					<div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 h-full">
						<h2 className="text-lg font-semibold tracking-tight mb-1">Create Private Room</h2>
						<p className="text-sm text-white/50 mb-4">
							Generate a room code and invite a friend to join.
						</p>
						<button
							onClick={handleCreateRoom}
							disabled={loading || localLoading}
							className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 font-semibold text-zinc-950 hover:opacity-90 transition disabled:opacity-50"
						>
							<Plus className="h-4 w-4" />
							{localLoading ? "Creating..." : "Create Room"}
						</button>
					</div>
				</div>

			{/* Browse Rooms */}
			<div className="space-y-4 pb-3">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
							<Globe className="h-5 w-5 text-cyan-400" />
							Open Rooms
						</h2>
						<p className="text-sm text-white/50 mt-0.5">Join an existing game</p>
					</div>
					<button
						onClick={actions.onRefresh}
						disabled={loading}
						className="rounded-2xl border border-white/10 bg-white/5 p-2.5 hover:bg-white/15 transition"
					>
						<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
					</button>
				</div>

				{rooms.length === 0 ? (
					<div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-12 text-center">
						<p className="text-white/40 text-sm">No open rooms right now</p>
						<p className="text-white/25 text-xs mt-1">Create one or invite a friend to join</p>
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
						{rooms.map((room: RoomInfo) => {
							const isOwner = room.owner?.id.toString() === userId;
							const isOpen = room.status === "OPEN";
							return (
								<div
									key={room.id}
									className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 hover:bg-white/[0.06] transition"
								>
									<div className="flex items-center justify-between mb-2">
										<div className="flex items-center gap-2">
											<Users className="h-4 w-4 text-white/40" />
											<span className="font-medium text-sm">#{room.id}</span>
										</div>
										<span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
											isOpen
												? "bg-emerald-500/10 text-emerald-300 border-emerald-400/20"
												: "bg-red-500/10 text-red-300 border-red-400/20"
										}`}>
											<span className={`h-1.5 w-1.5 rounded-full ${isOpen ? "bg-emerald-400" : "bg-red-400"}`} />
											{room.status}
										</span>
									</div>
									<div className="flex items-center justify-between gap-2">
										<span className="text-xs text-white/40">
											by {room.owner?.display_name}
										</span>
										<div className="flex items-center gap-2">
											{isOwner && (
												<button
													onClick={() => actions.onDeleteRoom(room.id)}
													className="rounded-xl border border-red-500/20 bg-red-500/5 p-2 text-red-400 hover:bg-red-500/10 transition"
												>
													<Trash2 className="h-3.5 w-3.5" />
												</button>
											)}
											<button
												onClick={() => actions.onJoinRoom(room.id)}
												disabled={!isOpen || loading}
													className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1.5 ${
													isOpen
														? "bg-white text-zinc-950 hover:opacity-90 disabled:opacity-40"
														: "bg-white/5 text-white/30 pointer-events-none"
												}`}
											>
												<LogIn className="h-3.5 w-3.5" />
												Join
											</button>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{rules && showRulesModal && (
				<div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
					<div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-zinc-950 p-5 sm:p-6 max-h-[90vh] overflow-auto">
						<div className="flex items-start justify-between gap-4 mb-4">
							<div>
								<h2 className="text-xl font-semibold">{rules.title}</h2>
								<p className="text-sm text-white/50 mt-1">Visual guides and quick rules</p>
							</div>
							<button
								onClick={() => setShowRulesModal(false)}
								className="rounded-xl border border-white/10 bg-white/5 p-2 hover:bg-white/10 transition"
							>
								<X className="h-4 w-4" />
							</button>
						</div>

						<ol className="space-y-2 text-sm text-white/70 list-decimal list-inside">
							{rules.rules.map((rule, i) => (
								<li key={i}>{rule}</li>
							))}
						</ol>

						<div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
							<h3 className="text-sm font-semibold text-white mb-3">Winning Example</h3>
							<div className="grid grid-cols-3 gap-2 max-w-[220px]">
								{["X", "X", "X", "O", null, "O", null, null, null].map((cell, index) => (
									<div key={index} className="aspect-square rounded-lg border border-white/15 bg-black/30 grid place-items-center text-lg font-bold">
										{cell === "X" ? <span className="text-cyan-300">X</span> : cell === "O" ? <span className="text-fuchsia-300">O</span> : null}
									</div>
								))}
							</div>
							<p className="text-xs text-white/50 mt-3">
								Example: three X marks in a row wins.
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
