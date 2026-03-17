// src/app/admin/api/site/config/[key]/route.ts
import { proxyFetch, forwardJson, serverError } from "../../../_lib/proxy";

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