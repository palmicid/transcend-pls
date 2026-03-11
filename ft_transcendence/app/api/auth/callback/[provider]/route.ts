import { NextResponse } from "next/server";
import { setUserId } from "@/lib/auth/auth-session";
import { cookies } from "next/headers";
import { 
  GoogleStrategy, 
  GitHubStrategy, 
  School42Strategy,
  OAuthProviderStrategy,
  redirectWithError
} from "@/lib/auth/auth-strategies";
import { syncUserWithDatabase } from "@/lib/auth/auth-database";

const STRATEGIES: Record<string, OAuthProviderStrategy> = {
  google: GoogleStrategy,
  github: GitHubStrategy,
  "42": School42Strategy,
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const { searchParams } = new URL(req.url);
  const strategy = STRATEGIES[provider];
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const protocol = req.headers.get("x-forwarded-proto") || "https";
  const baseUrl = `${protocol}://${host}`;
  
  if (!strategy) return redirectWithError("Provider not supported", baseUrl);
  
  try {
    // CSRF Check using oauth_state in cookies
    const cookieStore = await cookies();
    const savedState = cookieStore.get("oauth_state")?.value;
    const queryState = searchParams.get("state");

    if (!queryState || queryState !== savedState) {
      return redirectWithError("Security Breach: Invalid State", baseUrl);
    }
    cookieStore.delete("oauth_state");

    const code = searchParams.get("code");
    if (!code) return redirectWithError("Authorization code missing", baseUrl);

    const tokenData = await strategy.exchangeCode(code);
    const userInfo = await strategy.fetchUserInfo(tokenData);
    const user = await syncUserWithDatabase(userInfo, tokenData);

    await setUserId(user.id);
    return NextResponse.redirect(new URL("/2fa", baseUrl));

  } catch (error) {
    console.error(`[AUTH_ERROR_${provider.toUpperCase()}]:`, error);
    return redirectWithError("Authentication failed", baseUrl);
  }
}