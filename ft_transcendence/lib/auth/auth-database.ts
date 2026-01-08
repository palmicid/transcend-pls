import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { 
    UserInfo,
    TokenResponse
} from "@/lib/auth/auth-strategies";
import { encrypt } from "./auth-encryption";

// Upsert user and token in database
export async function syncUserWithDatabase(
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
        access_token: encrypt(tokenData.access_token),
        refresh_token: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : "",
        granted_scopes: tokenData.scope,
        expiry_date: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : new Date(Date.now() + 3599*1000),
      },
      create: {
        oauth_id: userInfo.sub,
        access_token: encrypt(tokenData.access_token),
        refresh_token: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : "",
        granted_scopes: tokenData.scope,
        expiry_date: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : new Date(Date.now() + 3599*1000),
        user_id: user.id,
      },
    });
    return user;
  });
}