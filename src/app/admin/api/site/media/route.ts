// src/app/admin/api/site/media/route.ts
import { proxyFetch, forwardJson, forwardNoContent, serverError } from "@/lib/proxy";

export async function GET() {
  try {
    return forwardJson(await proxyFetch("/api/site/media"));
  } catch (err) { return serverError(err); }
}

export async function POST(req: Request) {
  try {
    return forwardJson(await proxyFetch("/api/site/media", { method: "POST", body: await req.text() }));
  } catch (err) { return serverError(err); }
}