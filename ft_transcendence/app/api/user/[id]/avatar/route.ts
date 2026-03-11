import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { uploadAvatar } from "@/lib/minio";

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
        return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file");

        if (!file || !(file instanceof File)) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Only JPG and PNG files are accepted" },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: "File size must not exceed 1 MB" },
                { status: 400 }
            );
        }

        // Convert to buffer and upload to MinIO
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const avatarUrl = await uploadAvatar(userId, buffer, file.type);

        // Update user's avatar_url in the database
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { avatar_url: avatarUrl },
        });

        return NextResponse.json(
            { avatar_url: updatedUser.avatar_url },
            { status: 200 }
        );
    } catch (err) {
        console.error("Avatar upload error:", err);
        return NextResponse.json(
            { error: "Failed to upload avatar" },
            { status: 500 }
        );
    }
}
