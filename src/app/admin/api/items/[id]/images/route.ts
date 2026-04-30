// src/app/admin/api/items/[id]/images/route.ts
//
// FIX: previously this route used raw `fetch` with a hardcoded BASE constant,
// which (a) defaulted to a different port than every other route (7071 vs 5152),
// and (b) bypassed the Clerk JWT entirely. SAS-issuing endpoints MUST be
// authenticated. Now uses proxyFetch like the rest of the codebase.

import type { InventoryImage } from "@/types/inventory";
import { proxyFetch, serverError } from "@/lib/proxy";
import { NextResponse } from "next/server";

type Context = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Context) {
  try {
    const { id } = await params;
    const ttlMinutes = new URL(req.url).searchParams.get("ttlMinutes") ?? "60";

    const upstream = await proxyFetch(
      `/api/items/${encodeURIComponent(id)}/images?ttlMinutes=${encodeURIComponent(ttlMinutes)}`
    );

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      return new NextResponse(text || upstream.statusText, { status: upstream.status });
    }

    const raw = await upstream.json().catch(() => null);

    // Normalize: always return InventoryImage[]
    const images: InventoryImage[] = Array.isArray(raw) ? raw : raw ? [raw] : [];

    return NextResponse.json(images);
  } catch (err) {
    return serverError(err);
  }
}
