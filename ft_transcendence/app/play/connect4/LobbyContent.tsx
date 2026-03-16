"use client";

import GameLobbyContent from "@/components/game/lobby/GameLobbyContent";
import { createConnect4Room, setBotForSlot, startConnect4Game } from "./actions";
import { useRouter } from "next/navigation";
import { BotDifficulty } from "@/lib/bot/constants";

interface LobbyContentProps {
	userId: string;
	displayName: string;
}

export default function LobbyContent({
	userId,
	displayName,
}: LobbyContentProps) {
	const router = useRouter();

	const handlePlayBot = async (difficulty: string) => {
		const result = await createConnect4Room();
		if (result.ok && result.roomId) {
			await setBotForSlot({
				roomId: result.roomId,
				role: "Yellow",
				difficulty: difficulty as BotDifficulty,
			});
			await startConnect4Game(result.roomId);
			router.push(`/play/connect4/${result.roomId}`);
		}
	};
	return (
		<GameLobbyContent
			gameId="connect4"
			userId={userId}
			displayName={displayName}
			createRoom={createConnect4Room}
			onPlayBot={handlePlayBot}
			metadata={{
				name: "Connect 4",
				description: "Drop discs to connect 4 in any direction!",
				urlSlug: "connect4",
			}}
		/>
	);
}
