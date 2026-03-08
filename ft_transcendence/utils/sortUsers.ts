import { UserLite, FriendSort } from "@/types/friends"

export function sortUsers(users: UserLite[], type: FriendSort) {
  const list = [...users]

  if (type === "status") {
    return list.sort((a, b) => Number(b.online) - Number(a.online))
  }

  return list.sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  )
}
