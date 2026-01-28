import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/auth-session";
import { MainLayout } from "@/components/layout/MainLayout";
import Link from "next/link";
import { Construction, ArrowLeft, Gamepad2 } from "lucide-react";

export default async function RockPaperScissorsPage() {
  try {
    await requireAuth();
  } catch {
    redirect("/login");
  }

  return (
    <MainLayout showNav={true}>
      <div className="flex h-full items-center justify-center pt-12">
        <section className="w-full max-w-lg">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-7 sm:p-9 backdrop-blur-xl text-center">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />

            <div className="relative">
              {/* Icon */}
              <div className="mx-auto mb-6 h-20 w-20 rounded-3xl border border-amber-500/30 bg-amber-500/10 grid place-items-center">
                <Construction className="h-10 w-10 text-amber-400" />
              </div>

              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm text-amber-300 mb-4">
                <Gamepad2 className="h-4 w-4" />
                Coming Soon
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Rock–Paper–Scissors
              </h1>

              <p className="mt-4 text-white/70 leading-relaxed">
                We&apos;re working on bringing you a fast-paced multiplayer Rock-Paper-Scissors experience.
                Challenge your friends and settle debates in style!
              </p>

              <div className="mt-8 space-y-3">
                <Link
                  href="/play"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white hover:bg-white/15 hover:border-cyan-300/40 transition"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Games
                </Link>

                <Link
                  href="/play/tic-tac-toe"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3 font-semibold text-zinc-950 hover:opacity-90 transition"
                >
                  Play Tic–Tac–Toe Instead →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
