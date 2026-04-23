// src/app/api/reservations/route.ts
import { proxyFetch, forwardJson, serverError } from "@/lib/proxy";

export async function POST(req: Request) {
  try {
    const upstream = await proxyFetch("/api/reservations", {
      method: "POST",
      body: await req.text(),
    });
    return forwardJson(upstream);
  } catch (err) {
    return serverError(err);
  }
}
