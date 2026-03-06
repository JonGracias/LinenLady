// /admin/api/items/counts/route.ts
import { proxyFetch, forwardJson, serverError } from "../../_lib/proxy";

export async function GET() {
  try {
    const upstream = await proxyFetch("/api/items/counts");
    return forwardJson(upstream);
  } catch (err) {
    return serverError(err);
  }
}