import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { MainLayout } from "@/components/layout/MainLayout";
import LLMChatApp from "@/components/chat/LLMChatApp";

export default async function ChatPage() {
  let userId: string;
  try {
    userId = await requireAuth();
  } catch {
    redirect("/login");
  }

  const me = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (!me) redirect("/login");

  return (
    <MainLayout showNav={true}>
      <LLMChatApp />
    </MainLayout>
  );
}
