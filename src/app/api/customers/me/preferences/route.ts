// src/app/api/customers/me/preferences/route.ts
import { proxyJson } from "@/lib/proxy";

export const PUT = proxyJson({ path: () => "/api/customers/me/preferences", method: "PUT" });
