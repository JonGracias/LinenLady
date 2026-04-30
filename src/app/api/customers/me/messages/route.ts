// src/app/api/customers/me/messages/route.ts
import { proxyJson } from "@/lib/proxy";

export const GET  = proxyJson({ path: () => "/api/customers/me/messages" });
export const POST = proxyJson({ path: () => "/api/customers/me/messages", method: "POST" });
