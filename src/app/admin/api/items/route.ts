// src/app/admin/api/items/route.ts
import { NextResponse } from "next/server";

const BASE = process.env.LINENLADY_API_BASE_URL || "http://localhost:7071";

export async function GET({ params }) {

  const upstream = await fetch(`${BASE}/api/items`, {
    cache: "no-store",
  });

  // Pass through upstream errors
  if (!upstream.ok) {
    const text = await upstream.text();
    return new NextResponse(text, { status: upstream.status });
  }

  // Preserve the upstream JSON shape (whatever it returns)
  const data = await upstream.json();
  return NextResponse.json(data, { status: 200 });
}
