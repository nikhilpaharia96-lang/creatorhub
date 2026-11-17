import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { Errors } from "../lib/errors";
import { requireAuth } from "../middleware/auth-middleware";
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getAuthCookieOptions,
  ACCESS_TOKEN_MAX_AGE_MS,
  REFRESH_TOKEN_MAX_AGE_MS,
} from "../services/auth-service";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").max(120),
});

authRouter.post("/register", async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      next(Errors.Conflict("An account with this email already exists"));
      return;
    }

    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: { email: data.email, passwordHash, name: data.name },
    });

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id, tokenVersion: 0 });

    res.cookie("accessToken", accessToken, getAuthCookieOptions(ACCESS_TOKEN_MAX_AGE_MS));
    res.cookie("refreshToken", refreshToken, getAuthCookieOptions(REFRESH_TOKEN_MAX_AGE_MS));

    res.status(201).json({
      data: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    // Deliberately identical error for "no such user" and "wrong password"
    // — never reveal which one failed, that's an enumeration vector.
    if (!user) {
      next(Errors.Unauthorized("Invalid email or password"));
      return;
    }

    const isValid = await verifyPassword(data.password, user.passwordHash);
    if (!isValid) {
      next(Errors.Unauthorized("Invalid email or password"));
      return;
    }

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id, tokenVersion: 0 });

    res.cookie("accessToken", accessToken, getAuthCookieOptions(ACCESS_TOKEN_MAX_AGE_MS));
    res.cookie("refreshToken", refreshToken, getAuthCookieOptions(REFRESH_TOKEN_MAX_AGE_MS));

    res.status(200).json({
      data: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/refresh", async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      next(Errors.Unauthorized());
      return;
    }

    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      next(Errors.Unauthorized());
      return;
    }

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    res.cookie("accessToken", accessToken, getAuthCookieOptions(ACCESS_TOKEN_MAX_AGE_MS));
    res.status(200).json({ data: { success: true } });
  } catch {
    next(Errors.Unauthorized("Session expired. Please sign in again."));
  }
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/" });
  res.status(200).json({ data: { success: true } });
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) {
      next(Errors.NotFound("User not found"));
      return;
    }
    res.status(200).json({
      data: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});
