// src/app/admin/api/items/[id]/similar/route.ts
import { proxyJson } from "@/lib/proxy";

type P = { id: string };

export const GET = proxyJson<P>({
  path: ({ id }, req) => {
    const sp = new URL(req.url).searchParams;
    const top           = sp.get("top")           ?? "10";
    const minScore      = sp.get("minScore")      ?? "0.85";
    const publishedOnly = sp.get("publishedOnly") ?? "true";
    return `/api/items/${encodeURIComponent(id)}/similar`
      + `?top=${encodeURIComponent(top)}`
      + `&minScore=${encodeURIComponent(minScore)}`
      + `&publishedOnly=${encodeURIComponent(publishedOnly)}`;
  },
});
