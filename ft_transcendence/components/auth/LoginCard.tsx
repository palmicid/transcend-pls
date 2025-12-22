import { LogIn } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

export function LoginCard() {
  return (
    <section className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl">
      {/* glow */}
      <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-fuchsia-500/15 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative p-7 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-white/10 grid place-items-center">
            <LogIn className="h-5 w-5 text-white/80" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Login
            </h1>
            <p className="text-sm text-white/60">
              Access chat, games, and friends
            </p>
          </div>
        </div>

        <LoginForm />

        <OAuthButtons />
      </div>
    </section>
  );
}
