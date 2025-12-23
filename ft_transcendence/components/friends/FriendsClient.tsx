"use client";

import type { UserLite } from "@/types/friends";
import { useFriendsMock } from "@/hooks/useFriendsMock";
import { AddFriendCard } from "@/components/friends/AddFriendCard";
import { FriendListCard } from "@/components/friends/FriendListCard";
import { Users } from "lucide-react";

export default function FriendsClient({
  meId,
  users,
}: {
  meId: number;
  users: UserLite[];
}) {
  const {
    query,
    setQuery,
    friends,
    candidates,
    addFriend,
    removeFriend,
  } = useFriendsMock({ meId, users });

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Friends List
        </h1>
        <Users className="h-7 w-7 text-white/70" />
      </div>

      <AddFriendCard
        query={query}
        setQuery={setQuery}
        candidates={candidates}
        onAdd={addFriend}
      />

      <FriendListCard friends={friends} onRemove={removeFriend} />
    </div>
  );
}
