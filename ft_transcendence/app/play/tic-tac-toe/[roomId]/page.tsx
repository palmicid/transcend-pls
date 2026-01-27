import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/auth-session";
import { getSession } from "@/lib/auth/auth-session";
import { getRoomMeta } from "../actions";
import { MainLayout } from "@/components/layout/MainLayout";
import RoomView, { GameType } from "./RoomView";

type PageProps = {
  params: Promise<{ roomId: string }>;
  searchParams?: Promise<{ game?: string }>;
};

export default async function RoomPage({ params, searchParams }: PageProps) {
  const { roomId } = await params;
  const resolvedSearch = searchParams ? await searchParams : undefined;

  let userId: number;
  try {
    userId = await requireAuth();
  } catch {
    redirect("/login");
  }

  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const meta = await getRoomMeta(roomId);
  if (!meta) {
    throw new Error("Room not found");
  }

  const requestedGame = resolvedSearch?.game === "tic-tac-toe" ? "tic-tac-toe" : undefined;
  const resolvedGame: GameType = requestedGame
    ? requestedGame
    : meta.game_type === "tic-tac-toe"
      ? "tic-tac-toe"
      : "tic-tac-toe";

  return (
    <MainLayout showNav={true}>
      <RoomView
        roomId={roomId}
        userId={session.userId.toString()}
        gameType={resolvedGame}
        initialState={meta.status}
      />
    </MainLayout>
  );
}
