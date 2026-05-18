// src/app/api/customers/me/orders/[orderId]/cancel/route.ts
//
// Proxy for POST /api/customers/me/orders/{id}/cancel.
//
// Follows the same shape as the basket-item delete proxy at
// src/app/api/customers/me/basket/[reservationId]/route.ts — uses
// proxyFetch directly (rather than proxyJson's path-template) because
// the upstream URL needs the orderId interpolated, and the response
// might be a 409 with a structured body we want to forward intact.

import { proxyFetch, forwardJson, serverError } from "@/lib/proxy";

type Context = { params: Promise<{ orderId: string }> };

export async function POST(_req: Request, { params }: Context) {
  try {
    const { orderId } = await params;

    // Reject obvious garbage early so the upstream doesn't waste cycles.
    const id = Number.parseInt(orderId, 10);
    if (!Number.isFinite(id) || id <= 0) {
      return new Response("Invalid order id.", { status: 400 });
    }

    const upstream = await proxyFetch(
      `/api/customers/me/orders/${id}/cancel`,
      { method: "POST" }
    );

    // forwardJson preserves status code + body — important because the
    // C# side returns 409 with a structured JSON body for the
    // "already paid, can't cancel" case, and the frontend's
    // cancelOrder function in CustomerSessionContext parses that body
    // to route the customer to the message thread.
    return forwardJson(upstream);
  } catch (err) {
    return serverError(err);
  }
}