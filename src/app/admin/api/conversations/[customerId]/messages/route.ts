// src/app/admin/api/conversations/[customerId]/messages/route.ts
import { proxyJson, requireId } from "@/lib/proxy";

type P = { customerId: string };

export const POST = proxyJson<P>({
  path: ({ customerId }) =>
    `/api/admin/conversations/${requireId(customerId, "customerId")}/messages`,
  method: "POST",
});
