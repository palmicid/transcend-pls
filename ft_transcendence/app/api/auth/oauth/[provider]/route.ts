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
  { params }: { params: { provider: string } }
) {
  const provider = params.provider;
  const email = PROVIDER_TO_EMAIL[provider];

  if (!email) {
    return NextResponse.redirect(new URL("/login?error=unknown_provider", _req.url));
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.redirect(new URL("/login?error=user_not_seeded", _req.url));
  }

  await setUserId(String(user.id));
  return NextResponse.redirect(new URL("/main", _req.url));
}
