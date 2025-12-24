import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { setUserId } from "@/lib/auth";

interface GoogleTokenResponse {
  id_token: string;
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture: string;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return redirectWithError("Code missing");
  }

  try {
    // 1. Exchange Code for Tokens
    const tokenData = await exchangeCodeForTokens(code);

    // 2. Get User Info from Google
    const googleUser = await getGoogleUserInfo(tokenData.id_token);

    // 3. Database Operations (Transaction)
    const user = await syncUserWithDatabase(googleUser, tokenData);

    // 4. Create Session
    await setUserId(String(user.id));
    
    return NextResponse.redirect(new URL("/main", req.url));

  } catch (error) {
    console.error("[GOOGLE_AUTH_ERROR]:", error);
    return redirectWithError("OAuth authentication failed");
  }
}

/** * --- Helper Functions สำหรับแยก Logic ---*/

async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google token exchange failed: ${errorBody}`);
  }

  return response.json();
}

async function getGoogleUserInfo(idToken: string): Promise<GoogleUserInfo> {
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
  
  if (!response.ok) {
    throw new Error("Failed to verify Google ID Token");
  }

  return response.json();
}

async function syncUserWithDatabase(
  googleUser: GoogleUserInfo, 
  tokenData: GoogleTokenResponse
) {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email: googleUser.email },
      update: { avatar_url: googleUser.picture },
      create: {
        email: googleUser.email,
        username: `google_${googleUser.sub.substring(0, 8)}`, 
        password: "OAUTH_USER_NO_PASSWORD",
        avatar_url: googleUser.picture,
      },
    });

    await tx.google_auth.upsert({
      where: { google_id: googleUser.sub },
      update: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || undefined,
        granted_scopes: tokenData.scope,
        expiry_date: new Date(Date.now() + tokenData.expires_in * 1000),
      },
      create: {
        google_id: googleUser.sub,
        email: googleUser.email,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || "",
        granted_scopes: tokenData.scope,
        expiry_date: new Date(Date.now() + tokenData.expires_in * 1000),
        user_id: user.id,
      },
    });

    return user;
  });
}

function redirectWithError(message: string, req: Request) {
  const errorParam = encodeURIComponent(message);
  return NextResponse.redirect(new URL(`/login?error=${errorParam}`, req.url));
}