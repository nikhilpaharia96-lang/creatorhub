import { PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma client. Prevents exhausting the DB connection pool
 * from repeated instantiation (a common issue with hot-reload in dev).
 */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma = global.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
