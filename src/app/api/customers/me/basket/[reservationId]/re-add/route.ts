// src/app/api/customers/me/basket/[reservationId]/re-add/route.ts

import { proxyJson, requireId } from "@/lib/proxy";

type P = { reservationId: string };

export const POST = proxyJson<P>({
  path: ({ params }) => {
    const id = requireId(params.reservationId, "reservationId");
    return `/api/customers/me/basket/items/${id}/re-add`;
  },
  method: "POST",
});
