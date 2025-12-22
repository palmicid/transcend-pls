import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

import { MainLayout } from "@/components/layout/MainLayout";
import { HeroHeader } from "@/components/main/HeroHeader";
import { FeatureGrid } from "@/components/main/FeatureGrid";
import { RoomsList } from "@/components/main/RoomsList";

export default async function MainPage() {
  let userId: string;
  try {
    userId = await requireAuth();
  } catch {
    redirect("/login");
  }

  const me = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (!me) redirect("/login");

  const rooms = await prisma.room.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, type: true, maxUsers: true },
  });

  const userLabel = me.displayName ?? me.username ?? me.email ?? "User";

  return (
    <MainLayout userLabel={userLabel} showNav={true}>
      <HeroHeader userLabel={userLabel} />

      {/* Center 3 cards */}
      <FeatureGrid />

      {/* Rooms from seed/db */}
      <RoomsList rooms={rooms} />
    </MainLayout>
  );
}
