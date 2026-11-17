import type { NextFunction, Request, Response } from "express";
import { Errors } from "../lib/errors";
import { verifyAccessToken } from "../services/auth-service";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: "CUSTOMER" | "ADMIN";
      };
    }
  }
}

/**
 * Requires a valid access token cookie. Populates req.user.
 * Never trusts a client-supplied user id from headers/body — identity
 * comes only from the verified JWT.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.accessToken;
  if (!token) {
    next(Errors.Unauthorized());
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { userId: payload.userId, role: payload.role };
    next();
  } catch {
    next(Errors.Unauthorized("Session expired. Please sign in again."));
  }
}

/**
 * Requires the authenticated user to have the ADMIN role. Must be
 * used after requireAuth. Protects /admin/** server-side, not just
 * hidden client-side, per Section 11.
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    next(Errors.Unauthorized());
    return;
  }
  if (req.user.role !== "ADMIN") {
    next(Errors.Forbidden("Admin access required"));
    return;
  }
  next();
}
