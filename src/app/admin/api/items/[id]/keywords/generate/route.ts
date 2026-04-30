// src/app/admin/api/items/[id]/keywords/generate/route.ts
import { proxyJson } from "@/lib/proxy";

type P = { id: string };

export const POST = proxyJson<P>({
  path: ({ id }) => `/api/items/${encodeURIComponent(id)}/keywords/generate`,
  method: "POST",
});
