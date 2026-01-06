import { env } from "../env";
export interface OAuthConfig {
  authUrl: string;
  clientId: string;
  redirectUri: string;
  additionalParams?: Record<string, string>;
}

export const GoogleAuthConfig: OAuthConfig = {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    clientId: env.GOOGLE_CLIENT_ID!,
    redirectUri: env.GOOGLE_REDIRECT_URI!,
    additionalParams: {
      access_type: "offline",
      response_type: "code",
      prompt: "consent",
      scope: "openid email profile",
    },
}

export const GitHubAuthConfig: OAuthConfig = {
    authUrl: "https://github.com/login/oauth/authorize",
    clientId: env.GITHUB_CLIENT_ID!,
    redirectUri: env.GITHUB_REDIRECT_URI!,
    additionalParams: {
      scope: "user:email",
    },
}
  
export const School42AuthConfig: OAuthConfig = {
    authUrl: "https://api.intra.42.fr/oauth/authorize",
    clientId: env.FTBK_CLIENT_ID!,
    redirectUri: env.FTBK_REDIRECT_URI!,
    additionalParams: {
      response_type: "code",
    },
}