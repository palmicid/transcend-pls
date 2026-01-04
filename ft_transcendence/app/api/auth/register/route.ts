import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// import { bcrypt } from "bcryptjs";
import { setUserId } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => null);
        const email = body?.email?.trim();
        const password = body?.password;
        let username = body?.username?.trim();

        if (!email || !password) {
            return NextResponse.json({ ok: false, message: "Missing email or password" }, { status: 400 });
        }

        // const hashedPassword = await bcrypt.hash(password, 12);
        
        if (!username) {
            username = email.split("@")[0];
        }

        // Check existing
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }],
            },
        });

        
        
        if (existingUser) {
            return NextResponse.json({ ok: false, message: "User already exists" }, { status: 409 });
        }
        
        const newUser = await prisma.user.create({
            data: {
                email,
                username,
                
                password: password,
                // avatar_url and others have defaults
            },
        });

        await setUserId(String(newUser.id));

        return NextResponse.json({
            ok: true,
            user: { id: newUser.id, email: newUser.email, username: newUser.username },
        });
    } catch (error) {
        console.error("Register error:", error);
        return NextResponse.json({ ok: false, message: "Internal server error" }, { status: 500 });
    }
}
