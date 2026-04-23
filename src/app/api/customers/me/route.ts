// src/app/api/customers/me/route.ts
import { proxyFetch, forwardJson, serverError } from "@/lib/proxy";

export async function GET() {
  try {
    return forwardJson(await proxyFetch("/api/customers/me"));
  } catch (err) {
    return serverError(err);
  }
}

export async function PUT(req: Request) {
  try {
    const upstream = await proxyFetch("/api/customers/me", {
      method: "PUT",
      body: await req.text(),
    });
    return forwardJson(upstream);
  } catch (err) {
    return serverError(err);
  }
}
