/**
 * @file lib/utils/roomId.ts
 * @description Utilities for generating and validating game room IDs.
 */

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Generates a random 6-character uppercase alphanumeric room ID.
 * @returns A 6-character string.
 */
export function generateRoomId(): string {
  return Array.from({ length: 6 }, () =>
    CHARS[Math.floor(Math.random() * 26)]
  ).join("");
}

/**
 * Validates whether a given string is a valid room ID.
 * Must be exactly 6 uppercase letters.
 * @param id The string to validate
 * @returns true if valid, false otherwise
 */
export function isValidRoomId(id: string): boolean {
  if (!id) return false;
  return /^[A-Z]{6}$/.test(id);
}
