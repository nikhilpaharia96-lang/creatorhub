import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      JWT_ACCESS_SECRET: "test_access_secret_at_least_32_characters_long",
      JWT_REFRESH_SECRET: "test_refresh_secret_at_least_32_characters_long",
      RAZORPAY_KEY_ID: "rzp_test_fake_key_id",
      RAZORPAY_KEY_SECRET: "fake_key_secret_for_tests",
      RAZORPAY_WEBHOOK_SECRET: "fake_webhook_secret_for_tests",
      R2_ACCOUNT_ID: "fake_account_id",
      R2_ACCESS_KEY_ID: "fake_access_key",
      R2_SECRET_ACCESS_KEY: "fake_secret_key",
      R2_BUCKET_NAME: "test-bucket",
      CLIENT_ORIGIN: "http://localhost:5173",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/server.ts"],
    },
  },
});
