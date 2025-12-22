function storageKey(meId: number) {
  return `friends:v1:${meId}`;
}

export function loadFriendIds(meId: number): number[] {
  try {
    const raw = localStorage.getItem(storageKey(meId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => typeof x === "number") as number[];
  } catch {
    return [];
  }
}

export function saveFriendIds(meId: number, ids: number[]) {
  localStorage.setItem(storageKey(meId), JSON.stringify(ids));
}
