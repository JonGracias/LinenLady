// src/app/api/checkout/route.ts

import { proxyJson } from "@/lib/proxy";

export const POST = proxyJson({ path: () => "/api/checkout", method: "POST" });
