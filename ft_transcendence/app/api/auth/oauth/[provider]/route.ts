import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { setUserId } from "@/lib/auth";

// Mocked email addresses for each OAuth provider
const PROVIDER_TO_EMAIL: Record<string, string> = {
  google: "mobile@example.com",
  github: "ohm@example.com",
  "42": "palm@example.com",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  if (provider === 'google') {
    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const options = {
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      access_type: "offline",
      response_type: "code",
      prompt: "consent",
      scope: "openid email profile",
    };
    const qs = new URLSearchParams(options);
    return NextResponse.redirect(`${rootUrl}?${qs.toString()}`);
  }
  // else if (provider === 'github') {
  else {
    const rootUrl = "https://github.com/login/oauth/authorize";
    const options = {
      redirect_uri: process.env.GITHUB_REDIRECT_URI!,
      client_id: process.env.GITHUB_CLIENT_ID!,
      scope: "user:email",
    };
    const qs = new URLSearchParams(options);
    return NextResponse.redirect(`${rootUrl}?${qs.toString()}`);
  }

  // const email = PROVIDER_TO_EMAIL[provider];

  // if (!email) {
  //   return NextResponse.redirect(new URL("/login?error=unknown_provider", _req.url));
  // }

  // const user = await prisma.user.findUnique({ where: { email } });
  // if (!user) {
  //   return NextResponse.redirect(new URL("/login?error=user_not_seeded", _req.url));
  // }

  // await setUserId(String(user.id));
  // return NextResponse.redirect(new URL("/main", _req.url));
}
