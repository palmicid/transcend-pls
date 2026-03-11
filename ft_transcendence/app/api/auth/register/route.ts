import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { setUserId } from "@/lib/auth/auth-session";

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => null);
        const email = body?.email?.trim();
        const password = body?.password;

        if (!email || !password) {
            return NextResponse.json({ ok: false, message: "Missing email or password" }, { status: 400 });
        }

        //hash password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Check email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ ok: false, message: "Invalid email format" }, { status: 400 });
        }

        // Check existing email
        const isExistingEmail = await prisma.user.findFirst({
            where: { email },
        });

        if (isExistingEmail) {
            return NextResponse.json({ ok: false, message: "Email already in use" }, { status: 409 });
        }

        // Crate new user
        const newUser = await prisma.user.create({
            data: {
                email: email,
                password: hashedPassword,
            },
        });

        await setUserId(newUser.id);

        newUser.display_name = `Player${newUser.id}`;
        await prisma.user.update({
            where: { id: newUser.id },
            data: { display_name: newUser.display_name },
        });

        return NextResponse.json({
            ok: true,
            user: { id: newUser.id, email: newUser.email },
        });
    } catch (error) {
        console.error("Register error:", error);
        return NextResponse.json({ ok: false, message: "Internal server error" }, { status: 500 });
    }
}
