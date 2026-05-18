// src/app/api/customers/me/orders/[orderId]/route.ts
import { proxyFetch, forwardJson, serverError } from "@/lib/proxy";

type Context = { params: Promise<{ orderId: string }> };

export async function GET(_req: Request, { params }: Context) {
  try {
    const { orderId } = await params;
    const upstream = await proxyFetch(
      `/api/customers/me/orders/${orderId}`,
      { method: "GET" }
    );
    return forwardJson(upstream);
  } catch (err) {
    return serverError(err);
  }
}