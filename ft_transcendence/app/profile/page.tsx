import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProfileCard } from "@/components/profile/ProfileCard";

export default async function ProfilePage() {
  let userId: string;
  try {
    userId = await requireAuth();
  } catch {
    redirect("/login");
  }

  const me = await prisma.user.findUnique({
    where: { id: Number(userId) },
  });

  if (!me) redirect("/login");

  const userLabel = me.displayName ?? me.username ?? me.email ?? "User";

  return (
    <MainLayout userLabel={userLabel} showNav>
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Profile</h1>
          <p className="mt-2 text-white/60">
            Your account details (from database)
          </p>
        </div>

        <ProfileCard user={me} />

        <div className="mt-6">
          <a
            href="/main"
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition"
          >
            ← Back to Main
          </a>
        </div>
      </div>
    </MainLayout>
  );
}
