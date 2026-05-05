// src/app/api/customers/me/orders/route.ts

import { proxyJson } from "@/lib/proxy";

export const GET = proxyJson({ path: () => "/api/customers/me/orders" });
