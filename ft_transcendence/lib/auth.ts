import { cookies } from "next/headers";

export const AUTH_COOKIE_NAME = "userId";
export const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value || null;
}

export async function setUserId(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL / 1000, // Convert ms to seconds
    path: "/",
  });
}

export async function clearUserId(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function requireAuth(): Promise<string> {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("Unauthorized: Please log in");
  }
  return userId;
}
