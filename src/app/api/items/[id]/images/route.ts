// src/app/api/items/[id]/images/route.ts
import { proxyFetch, forwardJson, serverError } from "@/lib/proxy";

type Context = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Context) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const upstream = await proxyFetch(`/api/items/${id}/images?${searchParams.toString()}`);
    return forwardJson(upstream);
  } catch (err) {
    return serverError(err);
  }
}