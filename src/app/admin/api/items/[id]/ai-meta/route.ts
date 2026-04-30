// src/app/admin/api/items/[id]/ai-meta/route.ts
//
// Note: GET reads from /ai-meta but PATCH writes to /ai-meta/notes — that's
// the C# API's shape, not a typo.
import { proxyJson } from "@/lib/proxy";

type P = { id: string };

export const GET = proxyJson<P>({
  path: ({ id }) => `/api/items/${encodeURIComponent(id)}/ai-meta`,
});

export const PATCH = proxyJson<P>({
  path: ({ id }) => `/api/items/${encodeURIComponent(id)}/ai-meta/notes`,
  method: "PATCH",
});
