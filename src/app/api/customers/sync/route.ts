// src/app/api/customers/sync/route.ts
import { proxyJson } from "@/lib/proxy";

export const POST = proxyJson({ path: () => "/api/customers/sync", method: "POST" });
