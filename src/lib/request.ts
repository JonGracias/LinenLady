// src/lib/request.ts
//
// Client-side API helpers. Every call now attaches a FRESH Clerk session
// token as Authorization: Bearer.
//
// Why this exists (the expired-cookie bug):
//   Clerk session JWTs live for 60 seconds. While a tab is active, clerk-js
//   silently rotates the __session cookie — so cookie-based auth on our
//   Next.js proxy routes *appears* to work. But after the tab idles, the
//   laptop sleeps, or the user comes back later, the cookie holds an expired
//   JWT. A page NAVIGATION recovers via Clerk's handshake redirect; a
//   fetch/XHR cannot. Server-side auth().getToken() in the proxy can't
//   refresh from an expired cookie either — it just returns null, the proxy
//   forwards no token, and the C# API treats the caller as anonymous
//   (drafts vanish, /items/counts 401s, etc.).
//
//   Only client-side clerk-js can refresh, because it holds the long-lived
//   client session. window.Clerk.session.getToken() checks the cached
//   token's expiry and transparently mints a new one when needed — so
//   awaiting it immediately before each request guarantees freshness.
//
//   The proxy (src/lib/proxy.ts) prefers this forwarded Bearer header and
//   falls back to server-minting for callers that don't send one. The C#
//   API validates every JWT against Clerk's JWKS regardless of which path
//   supplied it, so forwarding a client-held token extends no trust.

declare global {
  interface Window {
    Clerk?: {
      loaded?: boolean;
      session?: {
        getToken(options?: { template?: string }): Promise<string | null>;
      } | null;
    };
  }
}

/**
 * Wait (bounded) for clerk-js to finish initializing. On a cold page load,
 * components mount and fire their data effects BEFORE the Clerk script has
 * hydrated the session — window.Clerk.session is null for the first few
 * hundred milliseconds even for a signed-in user. Without this wait, the
 * first wave of requests (inventory list, counts) goes out tokenless,
 * lands on an expired cookie at the proxy, and the admin sees a coerced
 * item list and 401'd counts until something re-fetches.
 */
async function waitForClerk(timeoutMs = 3000): Promise<void> {
  if (typeof window === "undefined") return;
  const start = Date.now();
  while (!window.Clerk?.loaded && Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 50));
  }
}

/**
 * Fresh Clerk session token, or null when unavailable (SSR, clerk-js not
 * yet loaded after the bounded wait, signed out). Null is fine: the proxy
 * falls back to its server-side mint, which still covers the fresh-cookie
 * case.
 */
async function clerkToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    await waitForClerk();
    return (await window.Clerk?.session?.getToken()) ?? null;
  } catch {
    return null;
  }
}

/** Merge a fresh Bearer header under any caller-supplied headers. */
async function withAuth(headers?: HeadersInit): Promise<HeadersInit> {
  const token = await clerkToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers ?? {}),
  };
}

/**
 * Drop-in replacement for bare fetch() on API routes that need auth.
 * Attaches a fresh token per call. Use this instead of fetch() in admin
 * components that currently call fetch(`/admin/api/...`) directly.
 */
export async function authedFetch(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    cache: "no-store",
    ...init,
    headers: await withAuth(init.headers),
  });
}

/**
 * Error thrown by apiGetJson / apiSendJson on non-2xx responses. Carries the
 * status code and the response body text so callers can branch on 401/404
 * etc. without parsing strings.
 */
export class ApiError extends Error {
  constructor(public status: number, public bodyText: string, public statusText: string) {
    super(`HTTP ${status}: ${bodyText || statusText}`);
    this.name = "ApiError";
  }
}

export type ApiGetJsonOptions = Omit<RequestInit, "method"> & {
  cache?: RequestCache;
};

export async function apiGetJson<T>(url: string, init?: ApiGetJsonOptions): Promise<T> {
  const res = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: await withAuth(init?.headers),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(res.status, text, res.statusText);
  }

  return (await res.json()) as T;
}

export type ApiSendJsonOptions = Omit<RequestInit, "method" | "body"> & {
  cache?: RequestCache;
};

export async function apiSendJson<TResponse, TBody>(
  url: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: TBody,
  init?: ApiSendJsonOptions
): Promise<TResponse> {
  // Only declare a JSON content-type when there's actually a JSON body to send.
  const headers: HeadersInit = await withAuth({
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(init?.headers ?? {}),
  });

  const res = await fetch(url, {
    method,
    cache: "no-store",
    ...init,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(res.status, text, res.statusText);
  }

  // If endpoint returns 204 No Content
  if (res.status === 204) return undefined as TResponse;

  return (await res.json()) as TResponse;
}
