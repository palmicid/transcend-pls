import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/auth-session";
import { getSession } from "@/lib/auth/auth-session";
import { getRoomMeta } from "@/app/play/actions";
import { MainLayout } from "@/components/layout/MainLayout";
import RoomView from "./RoomView";

type PageProps = {
  params: Promise<{ roomId: string }>;
};

export default async function RoomPage({ params }: PageProps) {
  const { roomId } = await params;

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
    // Or redirect to lobby with error
    redirect("/play/connect4");
  }

  if (meta.game_type !== "connect4") {
      redirect(`/play/${meta.game_type}/${roomId}`);
  }

  return (
    <MainLayout showNav={true}>
      <RoomView
        roomId={roomId}
        userId={session.userId.toString()}
        initialState={meta.status}
      />
    </MainLayout>
  );
}
