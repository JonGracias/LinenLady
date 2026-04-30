// src/app/admin/api/items/counts/route.ts
import { proxyJson } from "@/lib/proxy";

export const GET = proxyJson({ path: () => "/api/items/counts" });
