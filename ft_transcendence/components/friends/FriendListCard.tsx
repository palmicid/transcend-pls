"use client";

import type { UserLite } from "@/types/friends";
import { UserRow } from "@/components/friends/UserRow";

export function FriendListCard({
  friends,
  onRemove,
}: {
  friends: UserLite[];
  onRemove: (id: number) => void;
}) {
  return (
    <section className="mt-4 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
        <div className="font-semibold">Your Friends</div>
        <div className="text-xs text-white/55">
		  <span className="text-sm text-white/50">({friends.length}) </span>
 		  friends
		</div>
      </div>

      <div className="p-4 sm:p-5">
        {friends.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-white/60">
            No friends yet. Search above to add.
          </div>
        ) : (
          <ul className="space-y-3">
            {friends.map((u) => (
              <li key={u.id}>
                <UserRow
                  user={u}
                  action={
                    <button
                      type="button"
                      onClick={() => onRemove(u.id)}
                      className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition"
                    >
                      Remove
                    </button>
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
