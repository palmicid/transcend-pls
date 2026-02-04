import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { env } from "../env";

interface UserSession {
    userId: number;
    verify2FA: boolean;
}

export const AUTH_COOKIE_NAME = "auth_token"; 
const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);
export const SESSION_TTL = 24 * 60 * 60; // 24 hours (seconds)

export async function setUserId(user_id: number, final_2fa: boolean=false): Promise<void> {
  const token = await new SignJWT({ user_id, final_2fa })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL}s`)
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL,
    path: "/",
  });
}

export async function getSession(): Promise< UserSession | null > {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: (payload.user_id || payload.userId) as number,
      verify2FA: payload.final_2fa as boolean
    };
  } catch (error) {
    console.error("Invalid Token:", error);
    return null;
  }
}

export async function clearUserId(): Promise<void> {
  (await cookies()).delete(AUTH_COOKIE_NAME);
}

export async function requireAuth(): Promise<number> {
  const session = await getSession(); 
  if (!session || !session.verify2FA) {
    throw new Error("Unauthorized: Please log in");
  }
  return session.userId;
}
