import type { ApiErrorBody, ApiSuccess } from "@/types/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export class ApiRequestError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "ApiRequestError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * Central API client. Always sends credentials (httpOnly cookies) so
 * the backend's JWT auth works without ever touching localStorage.
 * Throws ApiRequestError with the backend's { code, message } on any
 * non-2xx response, so callers get a consistent error shape rather
 * than parsing fetch Response objects themselves.
 */
async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    credentials: "include",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorBody = payload as ApiErrorBody | null;
    throw new ApiRequestError(
      response.status,
      errorBody?.error?.code ?? "UNKNOWN_ERROR",
      errorBody?.error?.message ?? "Something went wrong. Please try again."
    );
  }

  return (payload as ApiSuccess<T>).data;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => apiRequest<T>(path, { method: "GET", signal }),
  post: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    apiRequest<T>(path, { method: "POST", body, signal }),
  patch: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    apiRequest<T>(path, { method: "PATCH", body, signal }),
  delete: <T>(path: string, signal?: AbortSignal) =>
    apiRequest<T>(path, { method: "DELETE", signal }),
};

/**
 * Fetches list-response meta alongside data. Product listing is the
 * only endpoint returning pagination meta today; kept as a separate
 * helper rather than complicating the generic client above.
 */
export async function apiGetWithMeta<T>(
  path: string,
  signal?: AbortSignal
): Promise<{ data: T; meta?: ApiSuccess<T>["meta"] }> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    credentials: "include",
    signal,
  });

  const payload = (await response.json()) as ApiSuccess<T> | ApiErrorBody;

  if (!response.ok) {
    const errorBody = payload as ApiErrorBody;
    throw new ApiRequestError(
      response.status,
      errorBody.error.code,
      errorBody.error.message
    );
  }

  const success = payload as ApiSuccess<T>;
  return { data: success.data, meta: success.meta };
}
