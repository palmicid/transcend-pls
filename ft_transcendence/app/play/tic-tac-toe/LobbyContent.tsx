"use client";

import GameLobbyContent from "@/components/game/lobby/GameLobbyContent";
import { createTicTacToeRoom, setBotForSlot, startTicTacToeGame } from "./actions";
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
		const result = await createTicTacToeRoom();
		if (result.ok && result.roomId) {
			await setBotForSlot({
				roomId: result.roomId,
				role: "O",
				difficulty: difficulty as BotDifficulty,
			});
			await startTicTacToeGame(result.roomId);
			router.push(`/play/tic-tac-toe/${result.roomId}`);
		}
	};
	return (
		<GameLobbyContent
			gameId="tic-tac-toe"
			userId={userId}
			displayName={displayName}
			createRoom={createTicTacToeRoom}
			onPlayBot={handlePlayBot}
			metadata={{
				name: "Tic-Tac-Toe",
				description: "Classic 3x3 grid game. Get 3 in a row to win!",
				urlSlug: "tic-tac-toe",
			}}
		/>
	);
}
