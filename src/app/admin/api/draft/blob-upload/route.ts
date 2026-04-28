// /admin/api/draft/blob-upload/route.ts
import type { CreateDraftResponse, DraftUpload } from "@/types/inventory";
import { proxyFetch, serverError } from "@/lib/proxy";

export const runtime = "nodejs";

async function putBlob(upload: DraftUpload, file: File): Promise<void> {
  const headers = new Headers(Object.entries(upload.requiredHeaders || {}));
  headers.set("Content-Type", upload.contentType);

  const res = await fetch(upload.uploadUrl, {
    method: "PUT",
    headers,
    body: await file.arrayBuffer(),
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
      return new Response("Missing draft JSON", { status: 400 });
    }

    const draft: CreateDraftResponse = JSON.parse(draftJson);
    const files = form.getAll("files").filter((f): f is File => f instanceof File);

    if (files.length !== draft.uploads.length) {
      return new Response("File count mismatch", { status: 400 });
    }

    for (let i = 0; i < draft.uploads.length; i++) {
      await putBlob(draft.uploads[i], files[i]);
    }

    const images = draft.uploads.map((u, i) => ({
      imagePath: u.blobName,
      isPrimary:  i === 0,
      sortOrder:  i + 1,
    }));

    const upstream = await proxyFetch(`/api/items/${draft.inventoryId}/images`, {
      method: "POST",
      body: JSON.stringify({ images }),
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      return new Response(text || upstream.statusText, { status: upstream.status });
    }

    const data = await upstream.json().catch(() => null);
    return Response.json(data ?? { ok: true });
  } catch (err) {
    return serverError(err);
  }
}