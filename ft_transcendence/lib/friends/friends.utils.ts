import type { UserLite } from "@/types/friends";

export function displayName(u: UserLite) {
  return u.displayName ?? u.username ?? u.email;
}

export function buildUserMap(users: UserLite[]) {
  const m = new Map<number, UserLite>();
  for (const u of users) m.set(u.id, u);
  return m;
}

export function searchCandidates({
  users,
  meId,
  friendIds,
  query,
  limit = 8,
}: {
  users: UserLite[];
  meId: number;
  friendIds: number[];
  query: string;
  limit?: number;
}) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return users
    .filter((u) => u.id !== meId)
    .filter((u) => !friendIds.includes(u.id))
    .filter((u) => {
      const uname = (u.username ?? "").toLowerCase();
      const dname = (u.displayName ?? "").toLowerCase();
      const email = u.email.toLowerCase();
      return uname.includes(q) || dname.includes(q) || email.includes(q);
    })
    .slice(0, limit);
}
