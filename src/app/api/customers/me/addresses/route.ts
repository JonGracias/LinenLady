// src/app/api/customers/me/addresses/route.ts
import { proxyFetch, forwardJson, serverError } from "@/app/admin/api/_lib/proxy";

export async function POST(req: Request) {
  try {
    const upstream = await proxyFetch("/api/customers/me/addresses", {
      method: "POST",
      body: await req.text(),
    });
    return forwardJson(upstream);
  } catch (err) {
    return serverError(err);
  }
}
