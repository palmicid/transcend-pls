import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { setUserId } from "@/lib/auth";
import { Prisma } from "@prisma/client";

interface TokenResponse {
  id_token: string;
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
}

interface UserInfo {
  sub: string;
  email: string;
  name: string;
  picture: string;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  if (!code) {
    return redirectWithError("Code missing", req);
  }
  try {
    // 1. Exchange Code for Tokens
    const tokenData = await exchangeCodeForTokens(provider, code);
    
    // 2. Get User Info from OAuth provider
    const oauthUser = await getUserInfo(provider, tokenData);
    
    // 3. Database Operations (Transaction)
    const user = await syncUserWithDatabase(oauthUser, tokenData);

    // 4. Create Session
    await setUserId(String(user.id));
    
    return NextResponse.redirect(new URL("/main", req.url));

  } catch (error) {
    console.error("[AUTH_ERROR]:", error);
    return redirectWithError("OAuth authentication failed", req);
  }
}

/** * --- Helper Functions สำหรับแยก Logic ---*/

async function exchangeCodeForTokens(provider: string, code: string): Promise<TokenResponse> {
  let response;
  if (provider === 'google') {
    response = await fetch("https://oauth2.googleapis.com/token", {
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
  }
  else if (provider === '42') {
    response = await fetch("https://api.intra.42.fr/oauth/token", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "application/json",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.FTBK_CLIENT_ID!,
        client_secret: process.env.FTBK_CLIENT_SECRET!,
        redirect_uri: process.env.FTBK_REDIRECT_URI!,
        grant_type: "authorization_code",
      }),
    });
  }
  else {
    response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "application/json",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GITHUB_CLIENT_ID!,
        client_secret: process.env.GITHUB_CLIENT_SECRET!,
        redirect_uri: process.env.GITHUB_REDIRECT_URI!,
      }),
    });
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Token exchange failed: ${errorBody}`);
  }

  return response.json();
}

async function getUserInfo(provider: string, token_data: TokenResponse): Promise<UserInfo> {
  let response: Response;
  if (provider === 'google') {
    response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token_data.id_token}`); 
  }
  else if (provider === '42') {
    response = await fetchWithBearerToken(`https://api.intra.42.fr/v2/me`, token_data); 
  }
  else {
    response = await fetchWithBearerToken('https://api.github.com/user', token_data);
  }
  if (!response.ok) {
    throw new Error("Failed to verify Token");
  }
  const rawData = await response.json();
  return {
    sub: rawData.sub || rawData.id.toString(),
    email: rawData.email || await getGithubEmail(token_data),
    name: rawData.name || rawData.login,
    picture: rawData.picture || rawData.avatar_url || rawData.image.link,
  } as UserInfo;
}

async function getGithubEmail(token_data: TokenResponse): Promise<string> {
  const response = await fetchWithBearerToken('https://api.github.com/user/emails', token_data)
  if (!response.ok) {
    throw new Error("Failed to verify Token");
  }
  const userEmails = await response.json();
  // return (userEmails.find(item => item.primary === true).email);
  return (userEmails.find((item: { primary: boolean; email: string }) => item.primary === true).email);
}

async function fetchWithBearerToken(url: string, token_data: TokenResponse): Promise<Response>{
   return await fetch(url,{
    headers: {
      'Authorization': `Bearer ${token_data.access_token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  });
}

async function syncUserWithDatabase(
  userInfo: UserInfo, 
  tokenData: TokenResponse
) {
  if (!userInfo.email || !userInfo.sub) {
    throw new Error("Missing required user info for database sync");
  }
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const user = await tx.user.upsert({
      where: { email: userInfo.email },
      update: { online_status: true, updated_at: new Date(Date.now()) },
      create: {
        email: userInfo.email,
        username: `OA_${userInfo.sub.substring(0, 5)}`, 
        password: "OAUTH_USER_NO_PASSWORD",
        avatar_url: userInfo.picture,
        online_status: true,
      },
    });

    await tx.oauth.upsert({
      where: { oauth_id: userInfo.sub },
      update: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || "",
        granted_scopes: tokenData.scope,
        expiry_date: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : new Date(Date.now() + 3599*1000),
      },
      create: {
        oauth_id: userInfo.sub,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || "",
        granted_scopes: tokenData.scope,
        expiry_date: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : new Date(Date.now() + 3599*1000),
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