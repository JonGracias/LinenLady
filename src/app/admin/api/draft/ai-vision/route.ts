import { NextResponse } from "next/server";
import type { AiPrefillRequest } from "@/types/inventory";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AiPrefillRequest;

    // Basic validation (keep it minimal)
    if (!body || typeof body.InventoryId !== "number") {
      return NextResponse.json({ error: "InventoryId is required" }, { status: 400 });
    }

    const apiBase = process.env.LINENLADY_API_BASE_URL || "http://localhost:7071";
    if (!apiBase) {
      return NextResponse.json({ error: "Missing BACKEND_API_BASE_URL" }, { status: 500 });
    }

    // Build the payload you send to C#
    const payload = {
      Overwrite: body.Overwrite ?? false,
      MaxImages: body.MaxImages ?? 4,
      ImageIds: body.ImageIds ?? null,

      // Optional fields (send only if present / non-empty)
      TitleHint: body.TitleHint?.trim() || null,
      Notes: body.Notes?.trim() || null,
    };

    // Call your Azure Functions / ASP.NET endpoint
    // Adjust the path to match your actual endpoint route.
    const resp = await fetch(`${apiBase}/api/items/${body.InventoryId}/ai-prefill`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",

        // If your backend is protected, include auth here:
        // "Authorization": `Bearer ${token}`,
        // or a function key header if you use one:
        // "x-functions-key": process.env.AZURE_FUNCTION_KEY!,
      },
      body: JSON.stringify(payload),
      // Optional: avoid caching for mutable operations
      cache: "no-store",
    });

    const text = await resp.text();

    if (!resp.ok) {
      // Forward backend error details
      return NextResponse.json(
        { error: "Backend error", status: resp.status, details: text },
        { status: resp.status }
      );
    }

    // If backend returns JSON, parse and forward
    const data = JSON.parse(text);
    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Unexpected error", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}