import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// import { setUserId } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { setUserId } from "@/lib/auth/auth-session";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = body?.email?.trim();
  const password = body?.password;

  if (!email || !password) {
    return NextResponse.json({ ok: false, message: "Missing email/password" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ ok: false, message: "Invalid credentials" }, { status: 401 });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return NextResponse.json({ ok: false, message: "Invalid credentials" }, { status: 401 });
  }

  await setUserId(user.id);
  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, display_name: user.display_name },
  });
}
