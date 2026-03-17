// src/app/api/items/[id]/similar/route.ts
import { proxyFetch, forwardJson, serverError } from "@/app/admin/api/_lib/proxy";

type Context = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Context) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const upstream = await proxyFetch(
      `/api/items/${id}/similar?${searchParams.toString()}`
    );
    return forwardJson(upstream);
  } catch (err) {
    return serverError(err);
  }
}