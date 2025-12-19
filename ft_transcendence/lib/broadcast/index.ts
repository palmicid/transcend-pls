/**
 * @file lib/broadcast/index.ts
 * @description Barrel exports for the broadcast module.
 *
 * Import from this file for clean, consistent imports:
 * ```ts
 * import { broadcaster, Broadcaster } from '@/lib/broadcast';
 * ```
 */

export { default as Broadcaster, type BroadcastListener } from "./Broadcaster";
export { default as InMemoryBroadcaster, broadcaster } from "./InMemoryBroadcaster";
