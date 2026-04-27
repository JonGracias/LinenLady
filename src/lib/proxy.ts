// src/lib/proxy.ts
//
// Server-side proxy utility — used by all Next.js API routes to forward
// requests to the C# backend (LinenLady.API).
//
// Auth model: each proxy call mints a fresh Clerk session token server-side
// via auth().getToken() and forwards it as Authorization: Bearer. The C# API
// validates the JWT against Clerk's JWKS (see Program.cs). Minting server-side
// avoids trusting any client-supplied Authorization header and keeps token
// handling out of the browser's fetch calls.

import { auth } from "@clerk/nextjs/server";

const BASE =
  process.env.LINENLADY_API_BASE_URL || "http://localhost:5152";

// ---------------------------------------------------------------------------
// Auth hook — mints a fresh Clerk session token for the current request.
// Returns an empty object for unauthenticated requests so public endpoints
// (items list, hero, etc.) still function without a token.
// ---------------------------------------------------------------------------
async function getAuthHeaders(): Promise<Record<string, string>> {
  const { getToken } = await auth();
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ---------------------------------------------------------------------------
// Core proxy — returns the raw Response so callers can handle status/body.
// ---------------------------------------------------------------------------
export type ProxyOptions = {
  method?: string;
  body?: BodyInit | null;
  headers?: Record<string, string>;
};

export async function proxyFetch(
  path: string,
  { method = "GET", body, headers = {} }: ProxyOptions = {}
): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  return fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...headers,
    },
    body: body ?? undefined,
    cache: "no-store",
  });
}

// ---------------------------------------------------------------------------
// Response helpers — keeps route handlers to a single line each.
// ---------------------------------------------------------------------------

/** Forward a JSON response (or error) from the upstream back to the client. */
export async function forwardJson(upstream: Response): Promise<Response> {
  const text = await upstream.text().catch(() => "");
  return new Response(text, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Forward a 204 No Content, or an upstream error. */
export async function forwardNoContent(upstream: Response): Promise<Response> {
  if (upstream.ok) return new Response(null, { status: 204 });
  const text = await upstream.text().catch(() => "");
  return new Response(text || upstream.statusText, {
    status: upstream.status,
  });
}

/** Standard 500 from a caught exception. */
export function serverError(err: unknown): Response {
  const msg =
    err instanceof Error ? err.message : String(err) || "Internal Server Error";
  return new Response(msg, { status: 500 });
}

/** Validate that a route param is a positive integer. Returns null if invalid. */
export function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}
