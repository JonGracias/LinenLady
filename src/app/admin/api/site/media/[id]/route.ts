// src/app/admin/api/site/media/[id]/route.ts
import { proxyFetch, forwardNoContent, serverError } from "@/lib/proxy";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Context) {
  try {
    const { id } = await params;
    return forwardNoContent(await proxyFetch(`/api/site/media/${id}`, { method: "DELETE" }));
  } catch (err) { return serverError(err); }
}