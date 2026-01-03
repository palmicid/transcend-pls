import qrcode from 'qrcode';
import { authenticator } from 'otplib';
import { getSession } from '@/lib/auth/auth-session';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { encrypt } from '@/lib/auth/crypto';


interface _UserInfo {
    username: string,
    is_verified: boolean,
}

export async function GET(): Promise<Response> {
    try {

        const session = await getSession();
        if (!session?.userId) 
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = session.userId;
        const user = await _getUserInfo(userId);
        if (!user)
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        if (user.is_verified == true)
            return NextResponse.json({
                data: null,
                isVerified: true,
            })
        const service = 'TranscenDEAD';
        const secret = authenticator.generateSecret();
        const otpauth = authenticator.keyuri(user.username, service, secret);
        
        const qrCodeUrl = await qrcode.toDataURL(otpauth);
        const encrypt_secret = encrypt(secret);
        await updateUserSecret(userId, encrypt_secret);
        return NextResponse.json({
            data: qrCodeUrl,
            isVerified: false,
        })
    } catch (err) {
        console.error(`[2FA_QR_GEN_ERROR_]:`, err);
        return NextResponse.json(
            { error: "Internal Server Error"},
            { status: 500 }
        )
    }
}

async function _getUserInfo(userId: number) : Promise< _UserInfo | null >{
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true, is_verified: true }
    });
    return user;
}

async function updateUserSecret(userId: number, secret: string) : Promise<void> {
    await prisma.user.update({
        where: { id: userId },
        data: { secret: secret},
    });
}