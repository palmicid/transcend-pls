"use client";

export function StatusPill({ online }: { online: boolean }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs border",
        online
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
          : "border-white/10 bg-white/5 text-white/70",
      ].join(" ")}
    >
      <span
        className={[
          "h-2 w-2 rounded-full",
          online ? "bg-emerald-400" : "bg-white/30",
        ].join(" ")}
      />
      {online ? "Online" : "Offline"}
    </span>
  );
}
