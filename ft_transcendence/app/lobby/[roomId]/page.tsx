import { getSession } from "@/lib/auth/auth-session";
import { getRoomMeta } from "../actions";
import RoomView, { GameType } from "./RoomView";

type PageProps = {
  params: Promise<{ roomId: string }>;
  searchParams?: Promise<{ game?: string }>;
};

export default async function RoomPage({ params, searchParams }: PageProps) {
  const { roomId } = await params;
  const resolvedSearch = searchParams ? await searchParams : undefined;
  const session = await getSession();
  if (!session) {
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
      userId={session.userId as string}
      gameType={resolvedGame}
      initialState={meta.state}
    />
  );
}
