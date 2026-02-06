import { NextResponse } from "next/server";

const BASE = process.env.LINENLADY_API_BASE_URL || "http://localhost:7071";

export async function POST(req: Request) {
  const body = await req.json();

  const upstream = await fetch(`${BASE}/api/items/drafts`, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    return new NextResponse(text || upstream.statusText, { status: upstream.status });
  }

  const data = await upstream.json();
  return NextResponse.json(data);
}
