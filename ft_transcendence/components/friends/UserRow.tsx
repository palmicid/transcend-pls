"use client";

import type { ReactNode } from "react";
import type { UserLite } from "@/types/friends";
import { displayName } from "@/lib/friends/friends.utils";
import { StatusPill } from "@/components/friends/StatusPill";

export function UserRow({
  user,
  action,
}: {
  user: UserLite;
  action: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="font-semibold truncate">{displayName(user)}</div>
        <div className="text-xs text-white/55 truncate">
          @{user.username ?? "-"} • {user.email}
        </div>
        <div className="mt-2">
          <StatusPill online={user.online} />
        </div>
      </div>
      {action}
    </div>
  );
}
