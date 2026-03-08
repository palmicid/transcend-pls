import { UserLite } from "@/types/friends"

export function searchUsers(users: UserLite[], query: string) {
  if (!query) return users

  const q = query.toLowerCase()

  return users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
  )
}
