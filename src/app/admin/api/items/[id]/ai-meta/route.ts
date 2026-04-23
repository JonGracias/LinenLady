// /admin/api/items/[id]/ai-meta/route.ts
import { proxyFetch, forwardJson, serverError } from "@/lib/proxy";

type Context = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Context) {
  try {
    const { id } = await params;
    const upstream = await proxyFetch(`/api/items/${encodeURIComponent(id)}/ai-meta`);
    return forwardJson(upstream);
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(req: Request, { params }: Context) {
  try {
    const { id } = await params;
    const body = await req.text();
    const upstream = await proxyFetch(
      `/api/items/${encodeURIComponent(id)}/ai-meta/notes`,
      { method: "PATCH", body }
    );
    return forwardJson(upstream);
  } catch (err) {
    return serverError(err);
  }
}