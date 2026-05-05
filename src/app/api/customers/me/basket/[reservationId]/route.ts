// src/app/api/customers/me/basket/[reservationId]/route.ts
import { proxyFetch, forwardJson, serverError } from "@/lib/proxy";

type Context = { params: Promise<{ reservationId: string }> };

export async function DELETE(_req: Request, { params }: Context) {
  try {
    const { reservationId } = await params;
    const upstream = await proxyFetch(
      `/api/customers/me/basket/items/${reservationId}`,
      { method: "DELETE" }
    );
    return forwardJson(upstream);
  } catch (err) {
    return serverError(err);
  }
}