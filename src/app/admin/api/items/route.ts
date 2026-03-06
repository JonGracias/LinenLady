// /admin/api/items/route.ts
import { proxyFetch, forwardJson, serverError } from "../_lib/proxy";

export async function GET(req: Request) {
  try {
    const qs = new URL(req.url).searchParams.toString();
    const upstream = await proxyFetch(qs ? `/api/items?${qs}` : "/api/items");
    return forwardJson(upstream);
  } catch (err) {
    return serverError(err);
  }
}