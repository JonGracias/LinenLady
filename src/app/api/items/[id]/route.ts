// src/app/api/items/[id]/route.ts
import { proxyFetch, forwardJson, serverError } from "@/app/admin/api/_lib/proxy";

type Context = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Context) {
  try {
    const { id } = await params;
    const upstream = await proxyFetch(`/api/items/${id}`);
    return forwardJson(upstream);
  } catch (err) {
    return serverError(err);
  }
}