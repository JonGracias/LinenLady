// src/lib/request.ts

export type ApiGetJsonOptions = Omit<RequestInit, "method"> & {
  cache?: RequestCache;
};

export async function apiGetJson<T>(url: string, init?: ApiGetJsonOptions): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
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
  const res = await fetch(url, {
    method,
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }

  // If endpoint returns 204 No Content
  if (res.status === 204) return undefined as TResponse;

  return (await res.json()) as TResponse;
}
