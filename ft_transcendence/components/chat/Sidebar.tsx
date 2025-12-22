"use client";

import Link from "next/link";
import type { ChatThread } from "@/types/chat";

export function Sidebar({
  threads,
  activeId,
  onNew,
  onSelect,
  onDelete,
}: {
  threads: ChatThread[];
  activeId: string;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <aside className="hidden lg:flex lg:w-72 xl:w-80 shrink-0">
      <div className="w-full rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="font-semibold">Chat History</div>
          <button
            type="button"
            onClick={onNew}
            className="rounded-2xl bg-white text-zinc-950 text-sm font-semibold px-3 py-2 hover:opacity-90 transition"
          >
            New
          </button>
        </div>

        <div className="p-2 max-h-[calc(100vh-240px)] overflow-y-auto">
          <ul className="space-y-2">
            {threads.map((t) => {
              const active = t.id === activeId;

              return (
                <li key={t.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelect(t.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect(t.id);
                      }
                    }}
                    className={[
                      "w-full text-left rounded-2xl px-3 py-3 border transition cursor-pointer outline-none",
                      "focus-visible:ring-2 focus-visible:ring-white/30",
                      active
                        ? "border-white/15 bg-white/10"
                        : "border-white/10 bg-white/[0.02] hover:bg-white/[0.06]",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">
                          {t.title}
                        </div>
                        <div className="text-xs text-white/55 mt-1">
                          {new Date(t.updatedAt).toLocaleString()}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(t.id);
                        }}
                        className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70 hover:bg-white/10 transition"
                        title="Delete chat"
                        aria-label="Delete chat"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-3 px-3 text-xs text-white/50">
            Mock data only (client). You can wire to DB later.
          </div>

          <div className="mt-3 px-3">
            <Link
              href="/main"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition"
            >
              Back to Main
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
