// src/app/admin/api/items/[id]/route.ts
import { proxyJson, forwardNoContent } from "@/lib/proxy";

type P = { id: string };

export const GET = proxyJson<P>({
  path: ({ id }) => `/api/items/${encodeURIComponent(id)}`,
});

export const PATCH = proxyJson<P>({
  path: ({ id }) => `/api/items/${encodeURIComponent(id)}`,
  method: "PATCH",
});

export const DELETE = proxyJson<P>({
  path: ({ id }) => `/api/items/${encodeURIComponent(id)}`,
  method: "DELETE",
  forward: forwardNoContent,
});
