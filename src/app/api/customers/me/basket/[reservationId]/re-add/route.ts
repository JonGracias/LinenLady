// src/app/api/customers/me/basket/[reservationId]/re-add/route.ts
import { proxyFetch, forwardJson, serverError } from "@/lib/proxy";

type Context = { params: Promise<{ reservationId: string }> };

export async function POST(_req: Request, { params }: Context) {
  try {
    const { reservationId } = await params;
    const upstream = await proxyFetch(
      `/api/customers/me/basket/items/${reservationId}/re-add`,
      { method: "POST" }
    );
    return forwardJson(upstream);
  } catch (err) {
    return serverError(err);
  }
}