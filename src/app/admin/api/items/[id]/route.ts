// /admin/api/items/[id]/route.ts
import { proxyFetch, forwardJson, forwardNoContent, serverError } from "../../_lib/proxy";

type Context = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Context) {
  try {
    const { id } = await params;
    const upstream = await proxyFetch(`/api/items/${id}`);
    return forwardJson(upstream);
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(req: Request, { params }: Context) {
  try {
    const { id } = await params;
    const body = await req.text();
    const upstream = await proxyFetch(`/api/items/${id}`, { method: "PATCH", body });
    return forwardJson(upstream);
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(_req: Request, { params }: Context) {
  try {
    const { id } = await params;
    const upstream = await proxyFetch(`/api/items/${id}`, { method: "DELETE" });
    return forwardNoContent(upstream);
  } catch (err) {
    return serverError(err);
  }
}