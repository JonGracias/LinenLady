// src/app/admin/api/items/[id]/images/route.ts
import { NextResponse } from "next/server";

const BASE = process.env.LINENLADY_API_BASE_URL || "http://localhost:7071";

type InventoryImage = {
  ImageId: number;
  ImagePath: string;
  IsPrimary: boolean;
  SortOrder: number;
  ReadUrl?: string | null;
};

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const ttlMinutes = url.searchParams.get("ttlMinutes") ?? "60";

  const upstream = await fetch(
    `${BASE}/api/items/${encodeURIComponent(params.id)}/images?ttlMinutes=${encodeURIComponent(ttlMinutes)}`,
    { cache: "no-store" }
  );

  if (!upstream.ok) {
    const text = await upstream.text();
    return new NextResponse(text, { status: upstream.status });
  }

  const raw = await upstream.json();

  // Normalize: always return InventoryImage[]
  const images: InventoryImage[] = Array.isArray(raw) ? raw : raw ? [raw] : [];

  return NextResponse.json(images);
}
