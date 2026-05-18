// src/app/api/customers/me/basket/route.ts
//
// GET  → /api/customers/me/basket          (list)
// POST → /api/customers/me/basket/items    (add)  — note path mismatch:
//        the C# API splits list and items into separate routes; the
//        frontend collapses them into one proxy file because Next.js
//        route handlers are file-per-route. The POST below maps onto
//        /items on the backend.
//
// Add lives at /basket POST (this file) so the call site looks like a
// natural REST collection. The DELETE for removal goes in the
// [reservationId]/route.ts file.

import { proxyJson } from "@/lib/proxy";

export const GET  = proxyJson({ path: () => "/api/customers/me/basket" });
export const POST = proxyJson({ path: () => "/api/customers/me/basket/items", method: "POST" });
