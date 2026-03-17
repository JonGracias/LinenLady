// src/app/api/items/sku/[sku]/route.ts
import { proxyFetch, forwardJson, serverError } from "@/app/admin/api/_lib/proxy";

type Context = { params: Promise<{ sku: string }> };

export async function GET(_req: Request, { params }: Context) {
  try {
    const { sku } = await params;
    const upstream = await proxyFetch(`/api/items/sku/${encodeURIComponent(sku)}`);
    return forwardJson(upstream);
  } catch (err) {
    return serverError(err);
  }
}