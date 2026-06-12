// src/lib/proxy.ts
//
// Server-side proxy utility — used by all Next.js API routes to forward
// requests to the C# backend (LinenLady.API).
//
// Auth model: prefer a client-forwarded Authorization: Bearer header, fall
// back to minting a token server-side via auth().getToken().
//
// Why the passthrough exists: Clerk session JWTs live 60 seconds. When a
// fetch fires after the tab has idled (sleep, background, lunch), the
// __session cookie holds an EXPIRED JWT. Page navigations recover via
// Clerk's handshake redirect; fetch/XHR cannot — and server-side
// auth().getToken() cannot refresh from an expired cookie, it just returns
// null. Only client-side clerk-js can refresh (it holds the long-lived
// client session), so src/lib/request.ts attaches a fresh token per call
// and we forward it.
//
// Forwarding a client-supplied token extends no trust: the C# API validates
// every JWT's signature, issuer, and expiry against Clerk's JWKS
// (see Program.cs). The proxy is a courier, not an authority — a forged or
// stale header fails validation upstream exactly as it would here.

import { auth } from "@clerk/nextjs/server";

const BASE = process.env.LINENLADY_API_BASE_URL || "http://localhost:5152";

// ---------------------------------------------------------------------------
// HttpError — thrown from path builders when validation fails. proxyJson
// catches it and returns the requested status instead of a generic 500.
// ---------------------------------------------------------------------------
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "HttpError";
  }
}

// ---------------------------------------------------------------------------
// Auth hook — prefers the client's forwarded Bearer header (fresh by
// construction: request.ts mints it via clerk-js immediately before the
// call), otherwise mints a token server-side from the session cookie.
// Returns an empty object for unauthenticated requests so public endpoints
// (items list, hero, etc.) still function without a token.
// ---------------------------------------------------------------------------
async function getAuthHeaders(req?: Request): Promise<Record<string, string>> {
  const forwarded = req?.headers.get("authorization");
  if (forwarded?.toLowerCase().startsWith("bearer ")) {
    return { Authorization: forwarded };
  }

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
  /**
   * The inbound Next.js request. When provided, its Authorization header
   * (if any) is forwarded upstream in preference to server-minting a token.
   * proxyJson passes this automatically; direct proxyFetch callers should
   * pass their `req` too so authed clients survive an expired cookie.
   */
  req?: Request;
};

export async function proxyFetch(
  path: string,
  { method = "GET", body, headers = {}, req }: ProxyOptions = {}
): Promise<Response> {
  const authHeaders = await getAuthHeaders(req);
  const finalHeaders: Record<string, string> = { ...authHeaders, ...headers };

  // Only auto-set application/json when:
  //   - the caller didn't already set Content-Type
  //   - there's a body to send
  //   - the body isn't FormData (which needs its own multipart boundary)
  const hasContentType = Object.keys(finalHeaders).some(
    (k) => k.toLowerCase() === "content-type"
  );
  if (body && !hasContentType && !(body instanceof FormData)) {
    finalHeaders["Content-Type"] = "application/json";
  }

  return fetch(`${BASE}${path}`, {
    method,
    headers: finalHeaders,
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

/** Standard error response — preserves HttpError status, otherwise 500. */
export function serverError(err: unknown): Response {
  if (err instanceof HttpError) {
    return new Response(err.message, { status: err.status });
  }
  const msg = err instanceof Error ? err.message : String(err) || "Internal Server Error";
  return new Response(msg, { status: 500 });
}

/** Validate that a route param is a positive integer. Returns null if invalid. */
export function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Validate-or-throw a positive integer route param (paired with proxyJson). */
export function requireId(raw: string, name = "id"): number {
  const n = parseId(raw);
  if (n === null) throw new HttpError(400, `Invalid ${name}`);
  return n;
}

// ---------------------------------------------------------------------------
// Route handler factory — collapses the GET/POST/PUT/PATCH/DELETE boilerplate
// that every passthrough route was reimplementing. For routes that need extra
// logic (multi-step blob uploads, etc.) keep using proxyFetch directly.
// ---------------------------------------------------------------------------

export type RouteCtx<P = Record<string, string>> = {
  params: Promise<P>;
};

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ProxyJsonOptions<P> = {
  /** Build the upstream path. Throw HttpError(status, msg) for validation failures. */
  path: (params: P, req: Request) => string;
  /** HTTP method to use upstream. Defaults to GET. */
  method?: Method;
  /** What to do with the upstream response. Defaults to forwardJson. */
  forward?: (upstream: Response) => Promise<Response>;
  /**
   * Whether to pass through the request body. Defaults to true for non-GET/DELETE.
   * Set false explicitly to ignore the request body (e.g. PATCH-as-toggle).
   */
  passBody?: boolean;
};

/**
 * Build a Route Handler that forwards the current request to a C# endpoint.
 *
 * @example
 *   // src/app/api/customers/me/route.ts
 *   export const GET = proxyJson({ path: () => "/api/customers/me" });
 *   export const PUT = proxyJson({ path: () => "/api/customers/me", method: "PUT" });
 *
 * @example  Validation that returns 400 instead of 500:
 *   type P = { id: string; imageId: string };
 *   export const DELETE = proxyJson<P>({
 *     path: ({ id, imageId }) => {
 *       const a = requireId(id, "id");
 *       const b = requireId(imageId, "imageId");
 *       return `/api/items/${a}/images/${b}`;
 *     },
 *     method: "DELETE",
 *     forward: forwardNoContent,
 *   });
 */
export function proxyJson<P = Record<string, string>>(opts: ProxyJsonOptions<P>) {
  const {
    path,
    method = "GET",
    forward = forwardJson,
    passBody = method !== "GET" && method !== "DELETE",
  } = opts;

  return async function handler(req: Request, ctx: RouteCtx<P>): Promise<Response> {
    try {
      const params = await ctx.params;
      const upstreamPath = path(params, req);
      const body = passBody ? await req.text() : undefined;
      const upstream = await proxyFetch(upstreamPath, { method, body, req });
      return forward(upstream);
    } catch (err) {
      return serverError(err);
    }
  };
}

/** Pull `?foo=bar` from a Request URL as a plain string (empty if none). */
export function searchString(req: Request): string {
  return new URL(req.url).search; // includes the leading "?" or ""
}
