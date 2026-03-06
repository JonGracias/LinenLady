// /admin/api/items/[id]/images/[imageId]/primary/route.ts
import { proxyFetch, forwardNoContent, serverError, parseId } from "../../../../../_lib/proxy";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string; imageId: string }> };

export async function PATCH(_req: Request, { params }: Context) {
  try {
    const { id, imageId } = await params;

    if (!parseId(id) || !parseId(imageId)) {
      return new Response("Invalid id(s)", { status: 400 });
    }

    const upstream = await proxyFetch(
      `/api/items/${id}/images/${imageId}/primary`,
      { method: "PATCH" }
    );

    return forwardNoContent(upstream);
  } catch (err) {
    return serverError(err);
  }
}