import { getUserId } from "@/lib/auth";
import { getRoomMeta } from "../actions";
import RoomView, { GameType } from "./RoomView";

type PageProps = {
  params: Promise<{ roomId: string }>;
  searchParams?: Promise<{ game?: string }>;
};

export default async function RoomPage({ params, searchParams }: PageProps) {
  const { roomId } = await params;
  const resolvedSearch = searchParams ? await searchParams : undefined;
  const userId = await getUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const meta = await getRoomMeta(roomId);
  const requestedGame = resolvedSearch?.game === "tic-tac-toe" ? "tic-tac-toe" : undefined;
  const resolvedGame: GameType = requestedGame
    ? requestedGame
    : meta.gameType === "tic-tac-toe"
      ? "tic-tac-toe"
      : "tic-tac-toe"; // Default to Tic-Tac-Toe since generic is removed

  return (
    <RoomView
      roomId={roomId}
      userId={userId}
      gameType={resolvedGame}
      initialState={meta.state}
    />
  );
}
