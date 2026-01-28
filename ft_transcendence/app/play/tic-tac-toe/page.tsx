import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/auth-session";
import { getSession } from "@/lib/auth/auth-session";
import { MainLayout } from "@/components/layout/MainLayout";
import LobbyContent from "./LobbyContent";

export default async function TicTacToePage() {
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

  return (
    <MainLayout showNav={true}>
      <LobbyContent userId={session.userId.toString()} />
    </MainLayout>
  );
}
