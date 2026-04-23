// src/app/admin/api/site/hero/route.ts
import { proxyFetch, forwardJson, serverError } from "@/lib/proxy";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    return forwardJson(await proxyFetch(`/api/site/hero?${searchParams.toString()}`));
  } catch (err) { return serverError(err); }
}

export async function POST(req: Request) {
  try {
    return forwardJson(await proxyFetch("/api/site/hero", { method: "POST", body: await req.text() }));
  } catch (err) { return serverError(err); }
}