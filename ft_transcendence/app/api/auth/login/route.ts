import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// import { setUserId } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { setUserId } from "@/lib/auth/auth-session";
import { SignJWT } from "jose";

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const user = await prisma.user.findUnique({
      where: { email },
    });

    //cx if user exits and password match
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Set user online
    await prisma.user.update({
      where: { id: user.id },
      data: { online_status: true, last_active_at: new Date() },
    });

    const response = NextResponse.json({
      ok: true,
      success: true,
      message: 'Logged in successfully',
    });

    await setUserId(user.id);

    return response;

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
