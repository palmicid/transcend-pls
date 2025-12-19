"use server";

import { setUserId, clearUserId } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Mock login - accept any userID and store in session
 * In production, this would validate credentials against a database
 */
export async function loginUser(userId: string): Promise<void> {
  // Validate userId is not empty
  if (!userId || userId.trim().length === 0) {
    throw new Error("User ID cannot be empty");
  }

  // Normalize userId (trim whitespace, convert to lowercase for consistency)
  const normalizedUserId = userId.trim().toLowerCase();

  // In a real app, you would:
  // 1. Check if user exists in database
  // 2. If not, create a new user
  // 3. Validate credentials
  // For now, we just store the userId in a session cookie

  await setUserId(normalizedUserId);
  redirect("/lobby");
}

export async function logoutUser(): Promise<void> {
  await clearUserId();
  redirect("/auth/login");
}
