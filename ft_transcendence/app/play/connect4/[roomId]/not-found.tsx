import { MainLayout } from "@/components/layout/MainLayout";
import GameRoomNotFound from "@/components/game/room/GameRoomNotFound";

export default function Connect4RoomNotFound() {
  return (
    <MainLayout showNav={true}>
      <GameRoomNotFound gameType="connect4" />
    </MainLayout>
  );
}
