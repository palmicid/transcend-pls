/**
 * @file lib/minio.ts
 * @description MinIO client singleton and avatar upload helper.
 */

import * as Minio from "minio";

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || "minio";
const MINIO_PORT = parseInt(process.env.MINIO_PORT || "9000", 10);
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || "minioadmin";
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || "minioadmin";
const MINIO_BUCKET = process.env.MINIO_BUCKET || "avatars";
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === "true";

/** Singleton MinIO client */
const minioClient = new Minio.Client({
    endPoint: MINIO_ENDPOINT,
    port: MINIO_PORT,
    useSSL: MINIO_USE_SSL,
    accessKey: MINIO_ACCESS_KEY,
    secretKey: MINIO_SECRET_KEY,
});

/**
 * Ensure the avatars bucket exists and has a public-read policy.
 */
async function ensureBucket(): Promise<void> {
    const exists = await minioClient.bucketExists(MINIO_BUCKET);
    if (!exists) {
        await minioClient.makeBucket(MINIO_BUCKET);

        // Allow public read so avatar URLs can be loaded by the browser
        const policy = {
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Principal: { AWS: ["*"] },
                    Action: ["s3:GetObject"],
                    Resource: [`arn:aws:s3:::${MINIO_BUCKET}/*`],
                },
            ],
        };
        await minioClient.setBucketPolicy(MINIO_BUCKET, JSON.stringify(policy));
    }
}

/**
 * Upload an avatar image to MinIO.
 *
 * @param userId  - The user's numeric ID
 * @param buffer  - The file contents as a Buffer
 * @param contentType - MIME type (image/jpeg or image/png)
 * @returns The publicly accessible URL for the uploaded avatar
 */
export async function uploadAvatar(
    userId: number,
    buffer: Buffer,
    contentType: string
): Promise<string> {
    await ensureBucket();

    const ext = contentType === "image/png" ? "png" : "jpg";
    const objectName = `${userId}/${Date.now()}.${ext}`;

    await minioClient.putObject(MINIO_BUCKET, objectName, buffer, buffer.length, {
        "Content-Type": contentType,
    });

    // Return a relative path so the browser resolves it against
    // whatever hostname the user is currently accessing (localhost, LAN IP, etc.).
    // Nginx proxies /minio/ to the MinIO container.
    return `/minio/${MINIO_BUCKET}/${objectName}`;
}

export { minioClient, MINIO_BUCKET };
