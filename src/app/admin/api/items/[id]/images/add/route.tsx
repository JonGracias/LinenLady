// /admin/api/items/[id]/images/add/route.ts
import type { InventoryImage } from "@/types/inventory";
import { proxyFetch, serverError, parseId } from "../../../../_lib/proxy";

export const runtime = "nodejs";

type NewBlobUrlResponse = {
  UploadUrl: string;
  RequiredHeaders: Record<string, string>;
  ContentType: string;
  BlobName: string;
};

type Context = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Context) {
  try {
    const { id } = await params;
    const inventoryId = parseId(id);

    if (!inventoryId) return new Response("Invalid id", { status: 400 });

    let files: File[];
    try {
      const form = await req.formData();
      files = form.getAll("file").filter((f): f is File => f instanceof File);
      if (files.length === 0)  return new Response("No files provided", { status: 400 });
      if (files.length > 10)   return new Response("Max 10 files per request", { status: 400 });
    } catch {
      return new Response("Invalid form data", { status: 400 });
    }

    const uploadedPaths: string[] = [];

    for (const file of files) {
      // 1. Get SAS upload URL for new blob
      const urlRes = await proxyFetch(
        `/api/items/${inventoryId}/images/new-blob-url?fileName=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type || "image/jpeg")}`
      );

      if (!urlRes.ok) {
        const text = await urlRes.text().catch(() => "");
        return new Response(text || urlRes.statusText, { status: urlRes.status });
      }

      const { UploadUrl, RequiredHeaders, ContentType, BlobName } =
        await urlRes.json() as NewBlobUrlResponse;

      // 2. PUT blob to Azure
      const blobHeaders = new Headers(Object.entries(RequiredHeaders ?? {}));
      blobHeaders.set("Content-Type", ContentType);

      const putRes = await fetch(UploadUrl, {
        method: "PUT",
        headers: blobHeaders,
        body: await file.arrayBuffer(),
        cache: "no-store",
      });

      if (!putRes.ok) {
        const text = await putRes.text().catch(() => "");
        return new Response(`Blob upload failed: ${putRes.status} ${text}`, { status: 502 });
      }

      uploadedPaths.push(BlobName);
    }

    // 3. Register blobs in DB
    const addRes = await proxyFetch(`/api/items/${inventoryId}/images`, {
      method: "POST",
      body: JSON.stringify({
        images: uploadedPaths.map((blobName) => ({
          imagePath: blobName,
          isPrimary: false,
        })),
      }),
    });

    if (!addRes.ok) {
      const text = await addRes.text().catch(() => "");
      return new Response(text || addRes.statusText, { status: addRes.status });
    }

    // 4. Return fresh image list
    const imagesRes = await proxyFetch(
      `/api/items/${inventoryId}/images?ttlMinutes=60`
    );

    if (!imagesRes.ok) return Response.json({ ok: true, images: [] });

    const images = await imagesRes.json() as InventoryImage[];
    return Response.json({ ok: true, images: Array.isArray(images) ? images : [] });
  } catch (err) {
    return serverError(err);
  }
}