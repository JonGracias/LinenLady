// src/app/api/customers/me/messages/unread-count/route.ts
import { proxyJson } from "@/lib/proxy";

export const GET = proxyJson({
  path: () => "/api/customers/me/messages/unread-count",
});
