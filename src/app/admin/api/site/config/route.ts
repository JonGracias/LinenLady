// src/app/admin/api/site/config/route.ts
import { proxyFetch, forwardJson, serverError } from "@/lib/proxy";

export async function GET() {
  try {
    return forwardJson(await proxyFetch("/api/site/config"));
  } catch (err) { return serverError(err); }
}