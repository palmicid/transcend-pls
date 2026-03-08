import { FriendRelation, UserLite } from "@/types/friends"

export function getAcceptedIds(
  relations: FriendRelation[],
  meId: number
): number[] {
  return relations.map((r) =>
    r.user_id === meId ? r.friend_id : r.user_id
  )
}

export function getIncomingRequests(
  relations: FriendRelation[],
  meId: number
): number[] {
  return relations
    .filter((r) => r.friend_id === meId)
    .map((r) => r.user_id)
}

export function getOutgoingRequests(
  relations: FriendRelation[],
  meId: number
): number[] {
  return relations
    .filter((r) => r.user_id === meId)
    .map((r) => r.friend_id)
}

export function mapUsers(ids: number[], users: UserLite[]) {
  return users.filter((u) => ids.includes(u.id))
}
