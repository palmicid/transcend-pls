"use client";

import { typography } from "@/design-system/typography";

export function StatusPill({ online }: { online: boolean }) {
  const color = online
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
    : "border-neutral-700 bg-neutral-800 text-neutral-400";

  const dot = online ? "bg-emerald-500" : "bg-neutral-500";

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border
        ${typography.caption}
        ${color}
      `}
    >
      <span
        className={`h-2 w-2 rounded-full ${dot}`}
      />

      {online ? "Online" : "Offline"}
    </span>
  );
}
