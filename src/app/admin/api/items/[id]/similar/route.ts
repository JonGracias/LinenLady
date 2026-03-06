// /admin/api/items/[id]/similar/route.ts
import { proxyFetch, forwardJson, serverError } from "../../../_lib/proxy";

type Context = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Context) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);

    const top           = searchParams.get("top")           ?? "10";
    const minScore      = searchParams.get("minScore")      ?? "0.85";
    const publishedOnly = searchParams.get("publishedOnly") ?? "true";

    const upstream = await proxyFetch(
      `/api/items/${encodeURIComponent(id)}/similar?top=${top}&minScore=${minScore}&publishedOnly=${publishedOnly}`
    );

    return forwardJson(upstream);
  } catch (err) {
    return serverError(err);
  }
}