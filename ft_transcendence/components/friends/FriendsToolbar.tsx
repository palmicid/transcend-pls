"use client";

import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import { FriendFilter, FriendSort } from "@/types/friends";

type Props = {
  query: string;
  setQuery: (v: string) => void;
  filter: FriendFilter;
  setFilter: (f: FriendFilter) => void;
  sort: FriendSort;
  setSort: (s: FriendSort) => void;
};

export default function FriendsToolbar({
  query,
  setQuery,
  filter,
  setFilter,
  sort,
  setSort,
}: Props) {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center">

      {/* Search */}
      <div className="flex-1 w-full">
        <SearchInput value={query} onChange={setQuery} />
      </div>

      {/* Filter */}
      <Select
        value={filter}
        onChange={(v) => setFilter(v as FriendFilter)}
        options={[
        { label: "Friends", value: "friends" },
        { label: "Requests", value: "requests" },
        { label: "Discover", value: "discover" },
        ]}
      />

      {/* Sort */}
      <Select
        value={sort}
        onChange={(v) => setSort(v as FriendSort)}
        options={[
        { label: "Sort by Name", value: "name" },
        { label: "Online First", value: "status" },
        ]}
      />

    </div>
  );
}
