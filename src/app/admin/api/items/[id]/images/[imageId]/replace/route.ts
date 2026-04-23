// /admin/api/items/[id]/images/[imageId]/replace/route.ts
import type { InventoryImage } from "@/types/inventory";
import { proxyFetch, serverError, parseId } from "@/lib/proxy";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string; imageId: string }> };

export async function POST(req: Request, { params }: Context) {
  try {
    const { id, imageId: imageIdStr } = await params;

    const inventoryId = parseId(id);
    const imageId     = parseId(imageIdStr);

    if (!inventoryId || !imageId) {
      return new Response("Invalid id(s)", { status: 400 });
    }

    let file: File;
    try {
      const form = await req.formData();
      const f = form.get("file");
      if (!(f instanceof File)) return new Response("Missing file", { status: 400 });
      file = f;
    } catch {
      return new Response("Invalid form data", { status: 400 });
    }

    // 1. Get SAS upload URL
    const urlRes = await proxyFetch(
      `/api/items/${inventoryId}/images/${imageId}/replace-url`
    );

    if (!urlRes.ok) {
      const text = await urlRes.text().catch(() => "");
      return new Response(text || urlRes.statusText, { status: urlRes.status });
    }

    const { UploadUrl, RequiredHeaders, ContentType } = await urlRes.json() as {
      UploadUrl: string;
      RequiredHeaders: Record<string, string>;
      ContentType: string;
    };

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

    // 3. Return fresh read URL from image list
    const imagesRes = await proxyFetch(
      `/api/items/${inventoryId}/images?ttlMinutes=60`
    );

    if (!imagesRes.ok) return Response.json({ ReadUrl: null });

    const images = await imagesRes.json() as InventoryImage[];
    const updated = images.find((img) => img.ImageId === imageId);

    return Response.json({ ReadUrl: updated?.ReadUrl ?? null });
  } catch (err) {
    return serverError(err);
  }
}