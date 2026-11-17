import { env } from "../config/env";

type LogLevel = "info" | "warn" | "error";

interface LogFields {
  [key: string]: unknown;
}

/**
 * Minimal structured logger. Emits JSON in production (for log
 * aggregators like CloudWatch/Datadog to parse), readable plain text
 * in development. Deliberately dependency-free — a full logging
 * library (pino/winston) is a reasonable v2 upgrade but not required
 * for MVP log volume.
 */
function log(level: LogLevel, message: string, fields?: LogFields) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...fields,
  };

  if (env.NODE_ENV === "production") {
    console[level === "info" ? "log" : level](JSON.stringify(entry));
  } else {
    const prefix = level === "error" ? "🔴" : level === "warn" ? "🟡" : "🔵";
    console[level === "info" ? "log" : level](
      `${prefix} ${message}`,
      fields ? fields : ""
    );
  }
}

export const logger = {
  info: (message: string, fields?: LogFields) => log("info", message, fields),
  warn: (message: string, fields?: LogFields) => log("warn", message, fields),
  error: (message: string, fields?: LogFields) => log("error", message, fields),
};
