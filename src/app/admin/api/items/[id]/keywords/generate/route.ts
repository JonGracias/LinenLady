// /admin/api/items/[id]/keywords/generate/route.ts
import { proxyFetch, forwardJson, serverError } from "@/lib/proxy";

type Context = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Context) {
  try {
    const { id } = await params;
    const body = await req.text(); // pass body through
    const upstream = await proxyFetch(
      `/api/items/${encodeURIComponent(id)}/keywords/generate`,
      { method: "POST", body }
    );
    return forwardJson(upstream);
  } catch (err) {
    return serverError(err);
  }
}