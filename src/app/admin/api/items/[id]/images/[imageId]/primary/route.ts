// src/app/admin/api/items/[id]/images/[imageId]/primary/route.ts
import { proxyJson, forwardNoContent, requireId } from "@/lib/proxy";

export const runtime = "nodejs";

type P = { id: string; imageId: string };

export const PATCH = proxyJson<P>({
  path: ({ id, imageId }) => {
    const a = requireId(id, "id");
    const b = requireId(imageId, "imageId");
    return `/api/items/${a}/images/${b}/primary`;
  },
  method: "PATCH",
  forward: forwardNoContent,
  passBody: false, // body-less toggle
});
