import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { MainLayout } from "@/components/layout/MainLayout";
import FriendsClient from "@/components/friends/FriendsClient";

export default async function FriendsPage() {
  let userId: string;
  try {
    userId = await requireAuth();
  } catch {
    redirect("/login");
  }

  const me = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (!me) redirect("/login");

  const users = await prisma.user.findMany({
    orderBy: { id: "asc" },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      online: true,
    },
  });

  return (
    <MainLayout showNav={true}>
      <FriendsClient meId={me.id} users={users} />
    </MainLayout>
  );
}

