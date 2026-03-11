import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/auth-session";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { userService } from "@/services/userService";

export default async function ProfilePage() {
  const session = await getSession();

  if (!session?.userId) redirect("/login");

  const me = await userService.getProfileById(session.userId);

  if (!me) redirect("/login");

  return (
    <MainLayout showNav={true}>
      <div className="mx-auto w-full max-w-3xl">
        <PageHeader
          title="Profile"
          description="Your account details"
        />

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
