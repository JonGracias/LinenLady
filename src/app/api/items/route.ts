// src/app/api/items/route.ts
import { proxyFetch, forwardJson, serverError } from "@/app/admin/api/_lib/proxy";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const upstream = await proxyFetch(`/api/items?${searchParams.toString()}`);
    return forwardJson(upstream);
  } catch (err) {
    return serverError(err);
  }
}