// src/app/api/reservations/route.ts
import { proxyJson } from "@/lib/proxy";

export const POST = proxyJson({ path: () => "/api/reservations", method: "POST" });
