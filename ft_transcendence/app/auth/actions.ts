"use server";

import { setUserId, clearUserId } from "@/lib/auth/auth-session";
import prisma from "@/lib/prisma";
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

  const parsedUserId = Number.parseInt(userId.trim(), 10);
  if (Number.isNaN(parsedUserId) || parsedUserId <= 0) {
    throw new Error("User ID must be a positive number");
  }

  const user = await prisma.user.findUnique({ where: { id: parsedUserId } });
  if (!user) {
    throw new Error("User not found");
  }

  await setUserId(parsedUserId);
  redirect("/lobby");
}

export async function logoutUser(): Promise<void> {
  await clearUserId();
  redirect("/auth/login");
}
