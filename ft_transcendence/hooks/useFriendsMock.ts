"use client";

import { useEffect, useMemo, useState } from "react";
import type { UserLite } from "@/types/friends";
import { loadFriendIds, saveFriendIds } from "@/lib/friends/friends.storage";
import { buildUserMap, searchCandidates } from "@/lib/friends/friends.utils";

export function useFriendsMock({
  meId,
  users,
}: {
  meId: number;
  users: UserLite[];
}) {
  const [friendIds, setFriendIds] = useState<number[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setFriendIds(loadFriendIds(meId));
  }, [meId]);

  const byId = useMemo(() => buildUserMap(users), [users]);

  const friends = useMemo(() => {
    return friendIds
      .map((id) => byId.get(id))
      .filter((u): u is UserLite => Boolean(u))
      .sort((a, b) => Number(b.online) - Number(a.online));
  }, [friendIds, byId]);

  const candidates = useMemo(() => {
    return searchCandidates({ users, meId, friendIds, query, limit: 8 });
  }, [users, meId, friendIds, query]);

  function addFriend(id: number) {
    setFriendIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [id, ...prev];
      saveFriendIds(meId, next);
      return next;
    });
  }

  function removeFriend(id: number) {
    setFriendIds((prev) => {
      const next = prev.filter((x) => x !== id);
      saveFriendIds(meId, next);
      return next;
    });
  }

  return {
    query,
    setQuery,
    friends,
    candidates,
    addFriend,
    removeFriend,
  };
}
