"use client";

import Link from "next/link";
import { Home, User, UserPlus, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function MainNavbar({ userLabel }: { userLabel: string }) {
  const router = useRouter();

  async function onLogout() {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) router.push("/");
    } catch (err) {
      console.error("Logout error", err);
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-zinc-950/40 backdrop-blur-xl">
      <div className="flex w-full items-center justify-between px-3 py-3 sm:px-4 lg:px-6">
        {/* Logo / Home */}
        <Link
          href="/main"
          className="
            group flex items-center gap-3
            transition-all
            hover:text-cyan-300
          "
        >
          <Home className="h-8 w-8 text-white/80 group-hover:text-cyan-300 transition" />
          <div className="leading-tight">
            <div className="font-semibold tracking-tight">
              42 TranscenDEAD ☠️
            </div>
            <div className="text-xs text-white/60 group-hover:text-cyan-300/80 transition">
              Chat • Games • Friends
            </div>
          </div>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Profile badge */}
          <Link
            href="/profile"
            title="View profile"
            className="
              hidden md:flex items-center gap-2
              rounded-2xl px-3 py-2
              border border-white/10 bg-white/5
              transition-all duration-200
              hover:bg-white/15
              hover:border-cyan-300/40
              hover:text-cyan-300
              hover:-translate-y-0.5
              hover:shadow-[0_0_30px_rgba(34,211,238,0.35)]
            "
          >
            <User className="h-4 w-4 text-white/70 group-hover:text-cyan-300 transition" />
            <span className="text-sm font-semibold truncate max-w-[120px]">
              {userLabel}
            </span>
          </Link>

          <nav className="flex items-center gap-2">
            {/* Friends */}
            <Link
              href="/friends"
              className="
                flex items-center gap-2
                rounded-2xl border border-white/10 bg-white/5
                px-3 py-2 text-sm
                transition-all
                hover:bg-white/15
                hover:border-cyan-300/40
                hover:text-cyan-300
                hover:-translate-y-0.5
                hover:shadow-[0_0_25px_rgba(34,211,238,0.35)]
              "
            >
              <UserPlus className="h-4 w-4" />
              Friends
            </Link>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="
                flex items-center gap-2
                rounded-2xl border border-red-500/30
                bg-white px-3 py-2 text-sm font-semibold
                text-zinc-950
                transition-all
                hover:bg-red-500
                hover:text-white
                hover:-translate-y-0.5
                hover:shadow-[0_8px_30px_rgba(239,68,68,0.45)]
                active:translate-y-0
              "
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
