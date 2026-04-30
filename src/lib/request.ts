// src/lib/request.ts

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
  const res = await fetch(url, { cache: "no-store", ...init });

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
  const headers: HeadersInit = {
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(init?.headers ?? {}),
  };

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
