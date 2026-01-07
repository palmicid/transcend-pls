import { NextResponse } from "next/server";
import crypto from 'crypto';
import { 
  OAuthConfig,
  GoogleAuthConfig,
  GitHubAuthConfig,
  School42AuthConfig
} from "@/lib/auth/auth-config";
import { env } from "@/lib/env";

export const AUTH_CONFIGS: Record<string, OAuthConfig> = {
    google: GoogleAuthConfig,
    github: GitHubAuthConfig,
    "42": School42AuthConfig,
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const config = AUTH_CONFIGS[provider as keyof typeof AUTH_CONFIGS];

    // Check if the requested Provider is supported
    if (!config) {
      return NextResponse.redirect(new URL("/login?error=unsupported_provider", req.url));
    }

    // Generate Secure State
    const state = crypto.randomBytes(32).toString('hex');
    
    // Generate Query Parameters
    const queryParams = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      state: state,
      ...config.additionalParams,
    });

    const targetUrl = `${config.authUrl}?${queryParams.toString()}`;
    const response = NextResponse.redirect(targetUrl);

    // Embed State into Cookie securely
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });

    return response;
  } catch (error) {
    console.error("OAuth Init Error:", error);
    return NextResponse.redirect(new URL("/login?error=server_error", req.url));
  }
}
