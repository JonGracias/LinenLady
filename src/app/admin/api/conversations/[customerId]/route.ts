// src/app/admin/api/conversations/[customerId]/route.ts
import { proxyJson, requireId, searchString } from "@/lib/proxy";

type P = { customerId: string };

export const GET = proxyJson<P>({
  path: ({ customerId }, req) =>
    `/api/admin/conversations/${requireId(customerId, "customerId")}${searchString(req)}`,
});
