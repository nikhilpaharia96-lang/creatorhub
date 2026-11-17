/**
 * Consistent, typed error shape for all API responses, per Section 21:
 * { error: { code, message } }. Never leaks stack traces or internal
 * details to the client.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = "AppError";
  }
}

export const Errors = {
  Unauthorized: (message = "Authentication required") =>
    new AppError(401, "UNAUTHORIZED", message),
  Forbidden: (message = "You do not have permission to perform this action") =>
    new AppError(403, "FORBIDDEN", message),
  NotFound: (message = "Resource not found") =>
    new AppError(404, "NOT_FOUND", message),
  Conflict: (message: string) => new AppError(409, "CONFLICT", message),
  Validation: (message = "Invalid request data") =>
    new AppError(422, "VALIDATION_ERROR", message),
  RateLimited: (message = "Too many requests, please try again later") =>
    new AppError(429, "RATE_LIMITED", message),
  Internal: (message = "Something went wrong. Please try again.") =>
    new AppError(500, "INTERNAL_ERROR", message),
  PaymentFailed: (message = "Payment verification failed") =>
    new AppError(402, "PAYMENT_FAILED", message),
};
