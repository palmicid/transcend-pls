import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { uploadAvatar } from "@/lib/minio";
import { getSession } from "@/lib/auth/auth-session";

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

/*
Detect the actual MIME type by reading the file's magic bytes.
Returns the MIME type string if recognised, or null otherwise.
*/
function detectMimeType(buffer: Buffer): string | null {
    if (buffer.length < 4) return null;

    // PNG: first 4 bytes are 89 50 4E 47
    if (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4E &&
        buffer[3] === 0x47
    ) {
        return "image/png";
    }

    // JPEG: first 3 bytes are FF D8 FF
    if (
        buffer[0] === 0xFF &&
        buffer[1] === 0xD8 &&
        buffer[2] === 0xFF
    ) {
        return "image/jpeg";
    }

    return null;
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
        return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const session = await getSession();
    if (!session || session?.userId !== userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

        // Convert to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Validate actual file content via magic bytes
        const detectedMime = detectMimeType(buffer);
        if (!detectedMime || !ALLOWED_TYPES.includes(detectedMime)) {
            return NextResponse.json(
                { error: "File content is corrupted or not an image or not supported" },
                { status: 400 }
            );
        }

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
