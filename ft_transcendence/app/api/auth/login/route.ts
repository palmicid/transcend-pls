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

    // create JWT payload
    const token = await new SignJWT({
      userId: user.id,
      final_2fa: user.use2FA
    })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET_KEY)

    const response = NextResponse.json({
      success: true,
      message: 'Logged in successfully',
    });

    // set HTTP only cookie (stateless auth)
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1-day in sec
    });

    return response;

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
