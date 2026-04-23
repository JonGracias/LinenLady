// /admin/api/draft/create/route.ts
import { proxyFetch, forwardJson, serverError } from "@/lib/proxy";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const upstream = await proxyFetch("/api/items/drafts", { method: "POST", body });
    return forwardJson(upstream);
  } catch (err) {
    return serverError(err);
  }
}