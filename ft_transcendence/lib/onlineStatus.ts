/**
 * @file lib/onlineStatus.ts
 * @description Shared helper to determine whether a user is online
 *              based on their last_active_at timestamp.
 */

/** Users inactive longer than this are considered offline. */
export const INACTIVITY_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Returns true if the user should be considered online.
 * A user is online when their last heartbeat was within the threshold.
 */
export function isUserOnline(lastActiveAt: Date | null): boolean {
    if (!lastActiveAt) return false;
    return Date.now() - lastActiveAt.getTime() < INACTIVITY_THRESHOLD_MS;
}
