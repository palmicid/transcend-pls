"use client";

import type { UserLite } from "@/types/friends";
import { UserRow } from "@/components/friends/UserRow";

export function AddFriendCard({
  query,
  setQuery,
  candidates,
  onAdd,
}: {
  query: string;
  setQuery: (v: string) => void;
  candidates: UserLite[];
  onAdd: (id: number) => void;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-white/10">
        <div className="font-semibold">Add Friend</div>
        <p className="mt-1 text-xs text-white/55">
          Search by username / display name / email
        </p>
      </div>

      <div className="p-4 sm:p-5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search username…"
          className="w-full rounded-2xl bg-black/20 border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/20 focus:bg-black/30 transition"
        />

        <div className="mt-4 space-y-3">
          {query.trim().length === 0 ? (
            <div className="text-sm text-white/50">Type something to search…</div>
          ) : candidates.length === 0 ? (
            <div className="text-sm text-white/50">No results (or already added).</div>
          ) : (
            candidates.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                action={
                  <button
                    type="button"
                    onClick={() => onAdd(u.id)}
                    className="shrink-0 rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-zinc-950 hover:opacity-90 transition"
                  >
                    Add
                  </button>
                }
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
