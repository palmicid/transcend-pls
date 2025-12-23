import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { setUserId } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = body?.email?.trim();
  const password = body?.password;

  if (!email || !password) {
    return NextResponse.json({ ok: false, message: "Missing email/password" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.password !== password) {
    return NextResponse.json({ ok: false, message: "Invalid credentials" }, { status: 401 });
  }

  await setUserId(String(user.id));
  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, displayName: user.displayName, username: user.username },
  });
}
