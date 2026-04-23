// src/app/api/reservations/[reservationId]/cancel/route.ts
import { proxyFetch, forwardJson, serverError } from "@/lib/proxy";

type Context = { params: Promise<{ reservationId: string }> };

export async function PATCH(_req: Request, { params }: Context) {
  try {
    const { reservationId } = await params;
    const upstream = await proxyFetch(
      `/api/reservations/${reservationId}/cancel`,
      { method: "PATCH" }
    );
    return forwardJson(upstream);
  } catch (err) {
    return serverError(err);
  }
}
