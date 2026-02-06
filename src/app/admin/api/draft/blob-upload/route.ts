import { NextResponse } from "next/server";
import type { CreateDraftResponse, DraftUpload } from "@/types/inventory";

export const runtime = "nodejs";  // Ensures Node features like Buffer if needed.

const BASE = process.env.LINENLADY_API_BASE_URL || "http://localhost:7071";

async function putBlob(upload: DraftUpload, file: File) {
  const headers = new Headers(Object.entries(upload.RequiredHeaders || {}));
  headers.set("Content-Type", upload.ContentType);

  const bytes = await file.arrayBuffer();
  const res = await fetch(upload.UploadUrl, {
    method: "PUT",
    headers,
    body: bytes,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Blob upload failed: ${res.status} ${text}`);
  }
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const draftJson = form.get("draft");
    if (typeof draftJson !== "string") {
      return new NextResponse("Missing draft JSON", { status: 400 });
    }
    const draft: CreateDraftResponse = JSON.parse(draftJson);

    const files = form.getAll("files").filter((f): f is File => f instanceof File);
    if (files.length !== draft.Uploads.length) {
      return new NextResponse(`File count mismatch`, { status: 400 });
    }

    // Upload files to Blob Storage
    for (let i = 0; i < draft.Uploads.length; i++) {
      await putBlob(draft.Uploads[i], files[i]);
    }

    // Prepare image payload exactly as given
    const images = draft.Uploads.map((u, i) => ({
      imagePath: u.BlobName, 
      isPrimary: i === 0,
      sortOrder: i + 1,
    }));

    // Send to your API to store in DB
    const upstream = await fetch(`${BASE}/api/items/${draft.InventoryId}/images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images }),
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      return new NextResponse(text || upstream.statusText, { status: upstream.status });
    }

    const data = await upstream.json().catch(() => null);
    return NextResponse.json(data ?? { ok: true });
  } catch (err: any) {
    return new NextResponse(err?.message || "Internal Server Error", { status: 500 });
  }
}
