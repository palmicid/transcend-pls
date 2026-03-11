import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/auth-session";
import { MainLayout } from "@/components/layout/MainLayout";
import FriendsClient from "@/components/friends/FriendsClient";

export default async function FriendsPage() {
  let userId: number;

  try {
    userId = await requireAuth();
  } catch {
    redirect("/login");
  }

  const me = await prisma.user.findUnique({
    where: { id: Number(userId) },
  });

  if (!me) redirect("/login");

  const usersRaw = await prisma.user.findMany({
    orderBy: { id: "asc" },
    select: {
      id: true,
      email: true,
      display_name: true,
      online_status: true,
    },
  });

  const users = usersRaw.map((u) => ({
    id: u.id,
    email: u.email,
    displayName: u.display_name,
    online: u.online_status,
  }));

  return (
    <MainLayout showNav={true}>
      <FriendsClient meId={me.id} users={users} />
    </MainLayout>
  );
}
