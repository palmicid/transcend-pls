import { NextResponse } from "next/server";
import { env } from "../env";

export interface TokenResponse {
  id_token: string;
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
}

export interface UserInfo {
  sub: string;
  email: string;
  name: string;
  picture: string;
}

export interface OAuthProviderStrategy {
  tokenUrl: string;
  userUrl: string;
  exchangeCode(code: string): Promise<TokenResponse>;
  fetchUserInfo(tokens: TokenResponse): Promise<UserInfo>;
}

export const GoogleStrategy: OAuthProviderStrategy = {
  tokenUrl: "https://oauth2.googleapis.com/token",
  userUrl: "https://oauth2.googleapis.com/tokeninfo",
  async exchangeCode(code) {
    const res = await fetch(this.tokenUrl, {
      method: "POST",
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });
    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`Token exchange failed: ${errorBody}`);
    }
    return res.json();
  },
  async fetchUserInfo(tokens) {
    const res = await fetch(`${this.userUrl}?id_token=${tokens.id_token}`);
    if (!res.ok) {
      throw new Error('Failed to verify Token');
    }
    const data = await res.json();
    return {
      sub: data.sub,
      email: data.email,
      name: data.name,
      picture: data.picture,
    };
  }
};

export const GitHubStrategy: OAuthProviderStrategy = {
  tokenUrl: "https://github.com/login/oauth/access_token",
  userUrl: "https://api.github.com/user",
  async exchangeCode(code) {
    const res = await fetch(this.tokenUrl, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "application/json",
      },
      body: new URLSearchParams({
        code,
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        redirect_uri: env.GITHUB_REDIRECT_URI,
      }),
    });
    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`Token exchange failed: ${errorBody}`);
    }
    return res.json();
  },
  async fetchUserInfo(tokens) {
    const res = await fetchWithBearerToken(this.userUrl, tokens);
    const data = await res.json();
    return {
      sub: data.id.toString(),
      email: data.email || await getGithubEmail(tokens),
      name: data.login,
      picture: data.avatar_url,
    };
  },
};

export const School42Strategy: OAuthProviderStrategy = {
  tokenUrl: 'https://api.intra.42.fr/oauth/token',
  userUrl: 'https://api.intra.42.fr/v2/me',
  async exchangeCode(code) {
    const res = await fetch(this.tokenUrl, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "application/json",
      },
      body: new URLSearchParams({
        code,
        client_id: env.FTBK_CLIENT_ID,
        client_secret: env.FTBK_CLIENT_SECRET,
        redirect_uri: env.FTBK_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });
    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`Token exchange failed: ${errorBody}`);
    }
    return res.json();
  },
  async fetchUserInfo(tokens) {
    const res = await fetchWithBearerToken(this.userUrl, tokens);
    const data = await res.json();
    return {
      sub: data.id.toString(),
      email: data.email,
      name: data.login,
      picture: data.image.link
    };
  }
}

// Get primary email from github api when email is private
async function getGithubEmail(token_data: TokenResponse): Promise<string> {
  const response = await fetchWithBearerToken('https://api.github.com/user/emails', token_data)
  if (!response.ok) {
    throw new Error("Failed to verify Token");
  }
  const userEmails = await response.json();
  return (userEmails.find((item: { primary: boolean; email: string }) => item.primary === true).email);
}

// Fetch url using bearer token in headers, for github, 42 api request
async function fetchWithBearerToken(url: string, token_data: TokenResponse): Promise<Response>{
  const res = await fetch(url,{
    headers: {
      'Authorization': `Bearer ${token_data.access_token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  });
  if (!res.ok) {
    throw new Error('Failed to verify Token');
  }
  return res;
}

export function redirectWithError(message: string, req: Request) {
  const errorParam = encodeURIComponent(message);
  return NextResponse.redirect(new URL(`/login?error=${errorParam}`, req.url));
}