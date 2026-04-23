// src/app/admin/api/_lib/proxy.ts
//
// Server-side proxy utility — used by all Next.js API routes to forward
// requests to the C# backend (Azure Functions / ASP.NET).
//
// Auth note: when you're ready to add authentication, inject the token
// via getAuthHeaders(). Every proxy call will pick it up automatically.

const BASE =
  process.env.LINENLADY_API_BASE_URL || "http://localhost:7071";

// ---------------------------------------------------------------------------
// Auth hook — fill this in when auth is ready.
// Could be: session token, Azure AD token, function key, etc.
// ---------------------------------------------------------------------------
function getAuthHeaders(): Record<string, string> {
  // Example (uncomment when ready):
  // const token = process.env.BACKEND_API_KEY;
  // if (token) return { Authorization: `Bearer ${token}` };
  //
  // Or for Azure Function key:
  // return { "x-functions-key": process.env.AZURE_FUNCTION_KEY! };
  return {};
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
  return fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
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