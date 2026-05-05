// src/app/api/customers/me/ask-noemi/route.ts

import { proxyJson } from "@/lib/proxy";

export const POST = proxyJson({ path: () => "/api/customers/me/ask-noemi", method: "POST" });
