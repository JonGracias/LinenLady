// src/app/admin/api/orders/[id]/route.ts
import { proxyJson, requireId } from "@/lib/proxy";

type P = { id: string };

export const GET = proxyJson<P>({
  path: ({ id }) => `/api/admin/orders/${requireId(id)}`,
});
