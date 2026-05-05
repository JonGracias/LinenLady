// src/app/api/customers/me/basket/[reservationId]/route.ts

import { proxyJson, requireId } from "@/lib/proxy";

type P = { reservationId: string };

export const DELETE = proxyJson<P>({
  path: ({ params }) => {
    const id = requireId(params.reservationId, "reservationId");
    return `/api/customers/me/basket/items/${id}`;
  },
  method: "DELETE",
});
