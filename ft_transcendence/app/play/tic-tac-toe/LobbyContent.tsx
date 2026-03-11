"use client";

import GameLobbyContent from "@/components/game/lobby/GameLobbyContent";
import { createTicTacToeRoom } from "./actions";

interface LobbyContentProps {
	userId: string;
	displayName: string;
}

export default function LobbyContent({
	userId,
	displayName,
}: LobbyContentProps) {
	return (
		<GameLobbyContent
			gameId="tic-tac-toe"
			userId={userId}
			displayName={displayName}
			createRoom={createTicTacToeRoom}
			metadata={{
				name: "Tic-Tac-Toe",
				description: "Classic 3x3 grid game. Get 3 in a row to win!",
				urlSlug: "tic-tac-toe",
			}}
		/>
	);
}
