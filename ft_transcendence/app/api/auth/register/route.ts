import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { setUserId } from "@/lib/auth/auth-session";
import { z } from "zod";

const emailSchema = z.string().email("Invalid email address");
const passwordSchema = z.string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

const registerSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
});

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => null);

        // Validate email & password using Zod schemas
        const parsed = registerSchema.safeParse(body);
        if (!parsed.success) {
            const message = parsed.error.errors[0]?.message ?? "Invalid input";
            return NextResponse.json({ ok: false, message }, { status: 400 });
        }

        const { email, password } = parsed.data;

        //hash password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

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
            data: { display_name: newUser.display_name, online_status: true, last_active_at: new Date() },
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
