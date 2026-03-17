// src/app/admin/api/site/hero/reorder/route.ts
import { proxyFetch, forwardNoContent, serverError } from "../../../_lib/proxy";

export async function PATCH(req: Request) {
  try {
    return forwardNoContent(await proxyFetch("/api/site/hero/reorder", { method: "PATCH", body: await req.text() }));
  } catch (err) { return serverError(err); }
}