export function HeroHeader({ userLabel }: { userLabel: string }) {
  return (
    <section className="mb-8 sm:mb-10">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8 overflow-hidden relative">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, <span className="text-white">{userLabel}</span> 👋
          </h1>
          <p className="mt-2 text-white/70 max-w-2xl">
            Choose what you want to do today — chat with 42AI, or play quick games with friends.
          </p>
        </div>
      </div>
    </section>
  );
}
