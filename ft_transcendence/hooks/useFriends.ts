"use client";

import { useEffect, useState } from "react"
import { FriendRelation } from "@/types/friends"

export default function useFriends(meId: number) {
  const [friends, setFriends] = useState<FriendRelation[]>([])
  const [pending, setPending] = useState<FriendRelation[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)

    const [f, p] = await Promise.all([
      fetch(`/api/friends/${meId}/accepted`).then((r) => r.json()),
      fetch(`/api/friends/${meId}/pending`).then((r) => r.json()),
    ])

    setFriends(f)
    setPending(p)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [meId])

  return { friends, pending, reload: load, loading }
}
