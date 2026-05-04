// src/app/admin/api/conversations/unread-count/route.ts
import { proxyJson } from "@/lib/proxy";

export const GET = proxyJson({
  path: () => "/api/admin/conversations/unread-count",
});
