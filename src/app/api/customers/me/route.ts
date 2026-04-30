// src/app/api/customers/me/route.ts
import { proxyJson } from "@/lib/proxy";

export const GET = proxyJson({ path: () => "/api/customers/me" });
export const PUT = proxyJson({ path: () => "/api/customers/me", method: "PUT" });
