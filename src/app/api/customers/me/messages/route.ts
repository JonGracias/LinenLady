// src/app/api/customers/me/messages/route.ts
import { proxyFetch, forwardJson, serverError } from "@/lib/proxy";

export async function GET() {
  try {
    return forwardJson(await proxyFetch("/api/customers/me/messages"));
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: Request) {
  try {
    const upstream = await proxyFetch("/api/customers/me/messages", {
      method: "POST",
      body: await req.text(),
    });
    return forwardJson(upstream);
  } catch (err) {
    return serverError(err);
  }
}
