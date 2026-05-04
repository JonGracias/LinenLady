// src/app/admin/api/conversations/route.ts
import { proxyJson, searchString } from "@/lib/proxy";

export const GET = proxyJson({
  path: (_, req) => `/api/admin/conversations${searchString(req)}`,
});
