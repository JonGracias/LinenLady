// src/app/api/customers/me/preferences/route.ts
import { proxyFetch, forwardJson, serverError } from "@/lib/proxy";

export async function PUT(req: Request) {
  try {
    const upstream = await proxyFetch("/api/customers/me/preferences", {
      method: "PUT",
      body: await req.text(),
    });
    return forwardJson(upstream);
  } catch (err) {
    return serverError(err);
  }
}
