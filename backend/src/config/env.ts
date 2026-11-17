import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("4000"),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  CLIENT_ORIGIN: z.string().url(),
});

/**
 * Validated environment config. Throws on startup if any required
 * variable is missing/malformed, rather than failing unpredictably
 * later at first use (e.g. a payment webhook silently no-op'ing
 * because a secret was undefined).
 */
export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
