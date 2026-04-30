// src/app/api/items/[id]/route.ts
import { proxyJson } from "@/lib/proxy";

type P = { id: string };

export const GET = proxyJson<P>({
  path: ({ id }) => `/api/items/${encodeURIComponent(id)}`,
});
