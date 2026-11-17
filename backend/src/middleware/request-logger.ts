import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger";

/**
 * Logs every request's method, path, status, and duration. Never
 * logs request/response bodies (could contain passwords, tokens, or
 * payment details) — only metadata.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startTime;
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

    logger[level]("request", {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs,
    });
  });

  next();
}
