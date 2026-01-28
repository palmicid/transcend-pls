import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/auth-session";
import { MainLayout } from "@/components/layout/MainLayout";
import Link from "next/link";
import { Circle, X, Gamepad2, ArrowRight } from "lucide-react";

export default async function PlayPage() {
  try {
    await requireAuth();
  } catch {
    redirect("/login");
  }

  return (
    <MainLayout showNav={true}>
      <section className="mb-8 sm:mb-10">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8 overflow-hidden relative">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Game Lobby 🎮
            </h1>
            <p className="mt-2 text-white/70 max-w-2xl">
              Choose a game to play with friends or challenge yourself against others.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2 max-w-4xl">
        {/* Tic-Tac-Toe */}
        <Link
          href="/play/tic-tac-toe"
          className="group rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6 hover:bg-black/20 transition block hover:text-cyan-400"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="h-12 w-12 rounded-2xl border border-white/10 bg-white/5 grid place-items-center transition-all duration-200 group-hover:scale-110 group-hover:bg-cyan-500/20 group-hover:border-cyan-400/40 group-hover:shadow-[0_0_30px_rgba(34,211,238,0.45)]">
              <div className="relative h-6 w-6">
                <Circle className="absolute inset-0 h-6 w-6 text-cyan-300 group-hover:text-cyan-200 transition" />
                <X className="absolute inset-0 h-6 w-6 text-cyan-300 group-hover:text-cyan-200 transition" />
              </div>
            </div>
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
              Play Now
            </span>
          </div>

          <div className="mt-4">
            <div className="text-lg font-semibold tracking-tight group-hover:translate-x-0.5 transition">
              Tic–Tac–Toe
            </div>
            <p className="mt-1 text-sm text-white/70">
              Quick match. Simple rules. Try to win in 3-in-a-row!
            </p>
            <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white">
              Enter Lobby <ArrowRight className="h-4 w-4 opacity-70 group-hover:opacity-100 transition" />
            </div>
          </div>
        </Link>

        {/* Rock Paper Scissors */}
        <Link
          href="/play/rock-paper-scissors"
          className="group rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6 hover:bg-black/20 transition block hover:text-emerald-400"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="h-12 w-12 rounded-2xl border border-white/10 bg-white/5 grid place-items-center transition-all duration-200 group-hover:scale-110 group-hover:bg-emerald-500/20 group-hover:border-emerald-400/40 group-hover:shadow-[0_0_30px_rgba(52,211,153,0.45)]">
              <Gamepad2 className="h-6 w-6 text-emerald-300 group-hover:text-emerald-200 transition" />
            </div>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
              Coming Soon
            </span>
          </div>

          <div className="mt-4">
            <div className="text-lg font-semibold tracking-tight group-hover:translate-x-0.5 transition">
              Rock–Paper–Scissors
            </div>
            <p className="mt-1 text-sm text-white/70">
              Fast rounds to settle any debate. Best of 3?
            </p>
            <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white">
              View Details <ArrowRight className="h-4 w-4 opacity-70 group-hover:opacity-100 transition" />
            </div>
          </div>
        </Link>
      </section>
    </MainLayout>
  );
}
