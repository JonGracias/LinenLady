// /admin/api/draft/ai-embeddings/route.ts
import type { EmbeddingsRequest } from "@/types/inventory";
import { proxyFetch, forwardJson, serverError } from "@/lib/proxy";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as EmbeddingsRequest;
    console.log('[ai-embeddings] body=', body); 

    if (!body || typeof body.InventoryId !== "number") {
      return Response.json({ error: "InventoryId is required" }, { status: 400 });
    }

    const payload: Record<string, unknown> = {
      InventoryId: body.InventoryId,
      Force: body.Opts?.Force ?? 4,
    };

    const purpose = body.Opts?.Purpose?.trim();
    if (purpose) payload.Purpose = purpose;

    const upstream = await proxyFetch(
      `/api/items/${body.InventoryId}/vectors/refresh`,
      { method: "POST", body: JSON.stringify(payload) }
    );

    return forwardJson(upstream);
  } catch (err) {
    return serverError(err);
  }
}