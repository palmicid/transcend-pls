import Link from "next/link";
import type { ReactNode } from "react";

const hoverText = {
  cyan: "hover:text-cyan-400",
  fuchsia: "hover:text-fuchsia-400",
  emerald: "hover:text-emerald-400",
} as const;

export function FeatureCard({
  title,
  desc,
  href,
  icon,
  color,
  badge,
}: {
  title: string;
  desc: string;
  href: string;
  icon: ReactNode;
  color: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className={`group rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6 hover:bg-black/20 transition block ${hoverText[color]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-400/30 to-cyan-300/20 ring-1 ring-white/10 grid place-items-center">
          <div className="text-xl">{icon}</div>
        </div>

        {badge ? (
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
            {badge}
          </span>
        ) : null}
      </div>

      <div className="mt-4">
        <div className="text-lg font-semibold tracking-tight group-hover:translate-x-0.5 transition">
          {title}
        </div>
        <p className="mt-1 text-sm text-white/70">{desc}</p>

        <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white">
          Open <span className="opacity-70 group-hover:opacity-100 transition">→</span>
        </div>
      </div>
    </Link>
  );
}
