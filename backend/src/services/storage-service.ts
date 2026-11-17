import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

const SIGNED_URL_TTL_SECONDS = 5 * 60; // 5 minutes — short-lived per Section 14

/**
 * Generates a short-lived signed download URL for a file in R2.
 * Callers MUST have already verified purchase entitlement server-side
 * before calling this — this function performs no authorization
 * checks itself, it only signs.
 */
export async function generateSignedDownloadUrl(
  fileStorageKey: string,
  downloadFileName: string
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: fileStorageKey,
    ResponseContentDisposition: `attachment; filename="${downloadFileName}"`,
  });

  return getSignedUrl(s3Client, command, { expiresIn: SIGNED_URL_TTL_SECONDS });
}
