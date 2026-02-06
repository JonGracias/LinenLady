import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: idRaw } = await ctx.params;
  const id = Number(idRaw);

  if (!id || Number.isNaN(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const backend =
    process.env.LINENLADY_API_BASE_URL ?? "http://localhost:7071";

  try {
    const resp = await fetch(`${backend}/api/items/${id}`, { cache: "no-store" });

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json(
        { error: text || "Backend error" },
        { status: resp.status }
      );
    }

    const data = await resp.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to reach backend" }, { status: 500 });
  }
}
