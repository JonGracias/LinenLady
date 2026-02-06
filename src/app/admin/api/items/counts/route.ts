import { NextResponse } from "next/server";

const BASE = process.env.LINENLADY_API_BASE_URL || "http://localhost:7071";

export async function GET() {
  const upstream = await fetch(`${BASE}/api/items/counts`, { cache: "no-store" });

  if (!upstream.ok) {
    const text = await upstream.text();
    return new NextResponse(text, { status: upstream.status });
  }

  const data = await upstream.json();
  return NextResponse.json(data, { status: 200 });
}
