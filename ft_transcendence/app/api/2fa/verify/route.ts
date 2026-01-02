import prisma from "@/lib/prisma";
import { authenticator } from "otplib";
import { getSession, setUserId } from "@/lib/auth/auth-session";
import { NextResponse } from "next/server";
import { redirect } from "next/dist/server/api-utils";

async function getUserSecret(userId: number): Promise<string>{
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { secret: true },
  });
  return user.secret;
}

async function updateUserIsVerified(userId: number): Promise<void>{
  await prisma.user.update({
    where: { id: userId },
    data: { is_verified: true }
  });
}

export async function POST(req: Request) {
  try {
    if (!req) throw new Error('Request not found');
    const { token } = await req.json();
    if (!token) throw new Error('Token not found');
    const session = await getSession();
    if (!session?.userId)
      throw new Error("Session not found");
    const userId = session.userId;
    const secret = await getUserSecret(userId);
    if (!secret) throw new Error("Secret not found");
    const isValid = authenticator.verify({ token, secret });
    if (!isValid) {
      return NextResponse.json({ 
        ok: false, 
        message: "Invalid OTP" 
      }, { status: 400 });
    }
    await Promise.all([
      updateUserIsVerified(userId),
      setUserId(userId, isValid)
    ]);
    return NextResponse.json({
      ok: true,
      message: "2FA Success.",
      redirectTo: "/dashboard"
    });
  } catch (err) {
    console.error("[2FA_VERIFY_POST_ERROR]:", err);
    return NextResponse.json(
      { ok: false, message: "Internal Server Error"},
      { status: 500 }
    );
  }
}
