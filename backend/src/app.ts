import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { authRouter } from "./routes/auth-routes";
import { productRouter } from "./routes/product-routes";
import { orderRouter, orderWebhookRouter } from "./routes/order-routes";
import { downloadRouter } from "./routes/download-routes";
import { wishlistRouter } from "./routes/wishlist-routes";
import { adminCustomerRouter } from "./routes/admin-customer-routes";
import { adminAnalyticsRouter } from "./routes/admin-analytics-routes";
import { adminCouponRouter } from "./routes/admin-coupon-routes";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { requestLogger } from "./middleware/request-logger";

export function createApp() {
  const app = express();

  // trust first proxy hop (Nginx/load balancer) so req.ip and
  // rate-limiting see the real client IP, not the proxy's.
  app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          // Razorpay Checkout.js requires its own script origin and
          // opens an iframe from checkout.razorpay.com.
          scriptSrc: ["'self'", "https://checkout.razorpay.com"],
          frameSrc: ["https://api.razorpay.com", "https://checkout.razorpay.com"],
          connectSrc: ["'self'", "https://api.razorpay.com"],
          imgSrc: ["'self'", "data:", "https:"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
    })
  );
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    })
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(requestLogger);

  // Global rate limit — sensitive endpoints (auth, downloads) layer
  // stricter limits on top of this via their own middleware.
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // The webhook route needs the exact raw request bytes for Razorpay
  // signature verification, so it's mounted on its own dedicated
  // router BEFORE the global express.json() parser consumes the
  // stream. All other /api/orders/* routes are mounted after, and
  // get normal JSON body parsing.
  app.use("/api/orders/webhook", orderWebhookRouter);

  app.use(express.json({ limit: "1mb" }));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: "RATE_LIMITED", message: "Too many attempts. Please try again later." } },
  });

  app.get("/health", (_req, res) => {
    res.status(200).json({ data: { status: "ok" } });
  });

  app.use("/api/auth", authLimiter, authRouter);
  app.use("/api/products", productRouter);
  app.use("/api/orders", orderRouter);
  app.use("/api/downloads", downloadRouter);
  app.use("/api/wishlist", wishlistRouter);
  app.use("/api/admin/customers", adminCustomerRouter);
  app.use("/api/admin/analytics", adminAnalyticsRouter);
  app.use("/api/admin/coupons", adminCouponRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
