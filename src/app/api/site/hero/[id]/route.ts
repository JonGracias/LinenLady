// src/app/admin/api/site/hero/[id]/route.ts
import { proxyFetch, forwardJson, forwardNoContent, serverError } from "@/lib/proxy";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Context) {
  try {
    const { id } = await params;
    return forwardJson(await proxyFetch(`/api/site/hero/${id}`, { method: "PATCH", body: await req.text() }));
  } catch (err) { return serverError(err); }
}

export async function DELETE(_req: Request, { params }: Context) {
  try {
    const { id } = await params;
    return forwardNoContent(await proxyFetch(`/api/site/hero/${id}`, { method: "DELETE" }));
  } catch (err) { return serverError(err); }
}