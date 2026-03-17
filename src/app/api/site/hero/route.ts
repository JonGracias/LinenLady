// src/app/api/site/hero/route.ts  ← public, no auth
import { proxyFetch, forwardJson, serverError } from "@/app/admin/api/_lib/proxy";

export async function GET() {
  try {
    return forwardJson(await proxyFetch("/api/site/hero?activeOnly=true"));
  } catch (err) { return serverError(err); }
}