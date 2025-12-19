/**
 * @file lib/rooms/index.ts
 * @description Barrel exports for the rooms module.
 *
 * Import from this file for clean, consistent imports:
 * ```ts
 * import { roomManager, Room, RoomState, State } from '@/lib/rooms';
 * ```
 */

export { default as Room } from "./Room";
export { default as RoomState, State } from "./RoomState";
export { default as RoomManager, roomManager, type RoomMeta } from "./RoomManager";
