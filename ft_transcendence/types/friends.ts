export type UserLite = {
  id: number
  displayName: string
  email: string
  online: boolean
}

export type FriendRelation = {
  id: number
  user_id: number
  friend_id: number
  is_accepted: boolean
  created_at: string
}

export type FriendFilter = "friends" | "requests" | "discover"
export type FriendSort = "name" | "status"
