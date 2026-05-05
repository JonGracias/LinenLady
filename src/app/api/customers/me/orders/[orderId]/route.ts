// src/app/api/customers/me/orders/[orderId]/route.ts

import { proxyJson, requireId } from "@/lib/proxy";

type P = { orderId: string };

export const GET = proxyJson<P>({
  path: ({ params }) => {
    const id = requireId(params.orderId, "orderId");
    return `/api/customers/me/orders/${id}`;
  },
});
