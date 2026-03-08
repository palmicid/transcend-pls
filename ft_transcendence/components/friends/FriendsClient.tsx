"use client";

import { useState, useMemo } from "react";

import FriendsToolbar from "@/components/friends/FriendsToolbar";
import FriendsSection from "@/components/friends/FriendsSection";
import UserRow from "@/components/friends/UserRow";
import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { colors } from "@/design-system/colors";

import {
  getAcceptedIds,
  getIncomingRequests,
  getOutgoingRequests,
  mapUsers,
} from "@/utils/friendSelectors";

import useFriends from "@/hooks/useFriends";
import { searchUsers } from "@/utils/searchUsers";
import { sortUsers } from "@/utils/sortUsers";
import { paginate } from "@/utils/paginate";

import { FriendFilter, FriendSort, UserLite } from "@/types/friends";

const PAGE_SIZE = 2;

export default function FriendsClient({
  meId,
  users,
}: {
  meId: number;
  users: UserLite[];
}) {
  const { friends, pending, reload } = useFriends(meId);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FriendFilter>("friends");
  const [sort, setSort] = useState<FriendSort>("name");
  const [page, setPage] = useState(1);

  // extract accepted friends and pending requests from the API data
  const acceptedIds = getAcceptedIds(friends, meId);
  const incomingIds = getIncomingRequests(pending, meId);
  const outgoingIds = getOutgoingRequests(pending, meId);

  const friendsUsers = mapUsers(acceptedIds, users);
  const requestUsers = mapUsers(incomingIds, users);

  const discover = users.filter(
    (u) =>
      u.id !== meId &&
      !acceptedIds.includes(u.id) &&
      !incomingIds.includes(u.id)
  );

  const dataset =
    filter === "friends"
      ? friendsUsers
      : filter === "requests"
      ? requestUsers
      : discover;

  const filtered = useMemo(
    () => sortUsers(searchUsers(dataset, query), sort),
    [dataset, query, sort]
  );

  const paged = paginate(filtered, page, PAGE_SIZE);

  // actions
  async function addFriend(id: number) {
    await fetch("/api/friends", {
      method: "POST",
      body: JSON.stringify({ userId: meId, friendId: id }),
    });

    reload();
  }

  async function cancelRequest(id: number) {
    await fetch(`/api/friends/${meId}/${id}`, { method: "DELETE" });
    reload();
  }

  async function acceptRequest(id: number) {
    await fetch(`/api/friends/${id}/${meId}`, { method: "PATCH" });
    reload();
  }

  async function removeFriend(id: number) {
    await fetch(`/api/friends/${meId}/${id}`, { method: "DELETE" });
    reload();
  }

  return (
    <div className={`mx-auto max-w-5xl ${colors.textPrimary}`}>

      <PageHeader
        title="Friends"
        description="Manage your connections and friend requests"
      />

      <Card>
        <FriendsToolbar
          query={query}
          setQuery={setQuery}
          filter={filter}
          setFilter={setFilter}
          sort={sort}
          setSort={setSort}
        />
      </Card>

      <div className="mt-6">
        <FriendsSection title={filter}>
          {paged.map((u) => {
            // FRIENDS
            if (filter === "friends")
              return (
                <UserRow
                  key={u.id}
                  user={u}
                  action={
                    <Button
                      variant="danger"
                      onClick={() => removeFriend(u.id)}
                    >
                      Remove
                    </Button>
                  }
                />
              );

            // REQUESTS
            if (filter === "requests")
              return (
                <UserRow
                  key={u.id}
                  user={u}
                  action={
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => acceptRequest(u.id)}
                      >
                        Accept
                      </Button>

                      <Button
                        variant="danger"
                        onClick={() => cancelRequest(u.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  }
                />
              );

            // DISCOVER
            const sent = outgoingIds.includes(u.id);

            return (
              <UserRow
                key={u.id}
                user={u}
                action={
                  sent ? (
                    <Button
                      variant="danger"
                      onClick={() => cancelRequest(u.id)}
                    >
                      Cancel Request
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={() => addFriend(u.id)}
                    >
                      Add Friend
                    </Button>
                  )
                }
              />
            );
          })}

          <Pagination
            page={page}
            total={Math.ceil(filtered.length / PAGE_SIZE)}
            setPage={setPage}
          />

        </FriendsSection>
      </div>
    </div>
  );
}
