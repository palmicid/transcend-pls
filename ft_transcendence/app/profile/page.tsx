import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/auth-session";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProfileCard } from "@/components/profile/ProfileCard";

export default async function ProfilePage() {
  const session = await getSession();

  if (!session?.userId) redirect("/login");

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/user/${session.userId}`,
    {
      cache: "no-store",
      headers: {
        Cookie: `session=${session.userId}`, // ส่ง cookie ไปด้วย
      },
    }
  );

  if (!res.ok)
    redirect("/login");

  const raw = await res.json();
  const me = {
    id: raw.id,
    email: raw.email,
    displayName: raw.display_name,
    avatarUrl: raw.avatar_url,
    online: raw.online_status,
    createdAt: raw.created_at,
    isVerified: raw.is_verified,
    use2FA: raw.use2FA,
  };

  return (
    <MainLayout showNav={true}>
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
