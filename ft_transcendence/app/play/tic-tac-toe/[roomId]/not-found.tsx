import { MainLayout } from "@/components/layout/MainLayout";
import GameRoomNotFound from "@/components/game/room/GameRoomNotFound";

export default function TicTacToeRoomNotFound() {
  return (
    <MainLayout showNav={true}>
      <GameRoomNotFound gameType="tic-tac-toe" />
    </MainLayout>
  );
}
