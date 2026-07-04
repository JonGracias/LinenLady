// src/app/admin/api/orders/[id]/checkpoint/route.ts
import { proxyJson, requireId } from "@/lib/proxy";

type P = { id: string };

export const POST = proxyJson<P>({
  path: ({ id }) => `/api/admin/orders/${requireId(id)}/checkpoint`,
  method: "POST",
});
