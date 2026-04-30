// src/app/admin/api/items/route.ts
import { proxyJson, searchString } from "@/lib/proxy";

export const GET = proxyJson({
  path: (_, req) => `/api/items${searchString(req)}`,
});
