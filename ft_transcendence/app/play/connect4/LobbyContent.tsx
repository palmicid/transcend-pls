"use client";

import GameLobbyContent from "@/components/game/lobby/GameLobbyContent";
import { createConnect4Room } from "./actions";

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
			gameId="connect4"
			userId={userId}
			displayName={displayName}
			createRoom={createConnect4Room}
			metadata={{
				name: "Connect 4",
				description: "Drop discs to connect 4 in any direction!",
				urlSlug: "connect4",
			}}
		/>
	);
}
