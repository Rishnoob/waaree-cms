import createClient, { type Middleware } from "openapi-fetch";

import { clearSession, getAccessToken } from "@/lib/auth/session";
import { env } from "@/lib/env";

import type { paths } from "./schema";

/**
 * Typed API client. Paths, params and responses come from the backend's OpenAPI
 * (`pnpm gen:api`), so a backend change that breaks the frontend fails the type check.
 */
export const api = createClient<paths>({
  baseUrl: env.NEXT_PUBLIC_API_URL,
  credentials: "include", // sends the httpOnly refresh cookie to /auth/*
});

/** Endpoints that never need a token (so public pages don't trigger a session check). */
const PUBLIC_PATHS = new Set(["/health", "/auth/login", "/auth/refresh", "/auth/logout", "/pages/public/{slug}", "/site/public", "/media/files/{name}", "/collections/public/{key}"]);

/** Adds the access token (refreshing it when close to expiry); a 401 ends the session. */
const auth: Middleware = {
  async onRequest({ request, schemaPath }) {
    if (PUBLIC_PATHS.has(schemaPath)) return request;
    const token = await getAccessToken();
    if (token) request.headers.set("Authorization", `Bearer ${token}`);
    return request;
  },
  onResponse({ response, schemaPath }) {
    if (response.status === 401 && !schemaPath.startsWith("/auth/")) clearSession();
    return response;
  },
};
api.use(auth);

/** Every backend error has this shape (waaree-apis/app/core/errors.py). */
export type ApiError = {
  error: { code: string; message: string; details: unknown };
};

/** Human message from an API error (or a network failure). */
export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error && typeof error === "object" && "error" in error) {
    const e = (error as ApiError).error;
    if (e.code === "validation_error" && Array.isArray(e.details) && e.details[0]) {
      const d = e.details[0] as { field?: string; message?: string };
      return d.field ? `${d.field}: ${d.message}` : (d.message ?? e.message);
    }
    return e.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

/** Unwrap an openapi-fetch result: return data or throw the API error (for TanStack Query). */
export function unwrap<T>(result: { data?: T; error?: unknown }): T {
  if (result.error !== undefined) throw new Error(errorMessage(result.error));
  return result.data as T;
}
