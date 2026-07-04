// src/app/admin/api/orders/route.ts
import { proxyJson } from "@/lib/proxy";

export const GET = proxyJson({ path: () => "/api/admin/orders" });
