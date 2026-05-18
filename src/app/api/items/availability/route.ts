// src/app/api/items/availability/route.ts
//
// GET /api/items/availability?ids=1,2,3,…
//
// Thin passthrough to the C# endpoint of the same shape. Anonymous-friendly:
// proxyJson forwards the Authorization header when a Clerk session exists,
// otherwise the upstream gets the call unauthenticated and personalises
// nothing (no YourBasket / YourPendingPayment states).
//
// Contract — confirmed with backend:
//   • items NOT in the response are available
//   • max 200 ids per request, non-integers silently dropped server-side
//   • response: { items: [{ inventoryId, state, blockingCustomerId }] }
//
// `searchString` carries the `ids` query string straight through; no need
// to parse it client-side just to re-serialise it.

import { proxyJson, searchString } from "@/lib/proxy";

export const GET = proxyJson({
  path: (_, req) => `/api/items/availability${searchString(req)}`,
});
