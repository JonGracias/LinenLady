// src/app/api/site/config/[key]/route.ts  ← PUBLIC — SitePhoto reads from here
import { proxyFetch, forwardJson, serverError } from "@/lib/proxy";

type Context = { params: Promise<{ key: string }> };

export async function GET(_req: Request, { params }: Context) {
  try {
    const { key } = await params;
    return forwardJson(await proxyFetch(`/api/site/config/${key}`));
  } catch (err) { return serverError(err); }
}

export async function PUT(req: Request, { params }: Context) {
  try {
    const { key } = await params;
    return forwardJson(await proxyFetch(`/api/site/config/${key}`, { method: "PUT", body: await req.text() }));
  } catch (err) { return serverError(err); }
}