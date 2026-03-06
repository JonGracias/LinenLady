// /admin/api/draft/ai-vision/route.ts
import type { AiPrefillRequest } from "@/types/inventory";
import { proxyFetch, forwardJson, serverError } from "../../_lib/proxy";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AiPrefillRequest;

    if (!body || typeof body.InventoryId !== "number") {
      return Response.json({ error: "InventoryId is required" }, { status: 400 });
    }

    const payload = {
      Overwrite:  body.Overwrite  ?? false,
      MaxImages:  body.MaxImages  ?? 4,
      ImageIds:   body.ImageIds   ?? null,
      TitleHint:  body.TitleHint?.trim()  || null,
      Notes:      body.Notes?.trim()      || null,
    };

    const upstream = await proxyFetch(
      `/api/items/${body.InventoryId}/ai-prefill`,
      { method: "POST", body: JSON.stringify(payload) }
    );

    return forwardJson(upstream);
  } catch (err) {
    return serverError(err);
  }
}