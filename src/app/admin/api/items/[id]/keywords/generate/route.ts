// /admin/api/items/[id]/keywords/generate/route.ts
import { proxyFetch, forwardJson, serverError } from "../../../../_lib/proxy";

type Context = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Context) {
  try {
    const { id } = await params;
    const upstream = await proxyFetch(
      `/api/items/${encodeURIComponent(id)}/keywords/generate`,
      { method: "POST" }
    );
    return forwardJson(upstream);
  } catch (err) {
    return serverError(err);
  }
}