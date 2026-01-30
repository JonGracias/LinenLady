// src/lib/linenladyapi.ts

import type { InventoryItem,
              InventoryImage, 
              DraftUpload,
              CreateDraftRequest,
              CreateDraftResponse
            } from "@/types/inventory";


const BASE = process.env.LINENLADY_API_BASE_URL || "http://localhost:7071";


type GetItemsResponse = {
  items: InventoryItem[];
};

/** ---------------------------------
 * HTTP helpers
 * ---------------------------------- */

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

/** ---------------------------------
 * Images
 * ---------------------------------- */

export async function getItemImages(
  inventoryId: number,
  ttlMinutes = 60
): Promise<InventoryImage[]> {
  const raw = await apiFetch<InventoryImage[]>(
    `/api/items/${inventoryId}/images?ttlMinutes=${encodeURIComponent(
      String(ttlMinutes)
    )}`
  );
  return Array.isArray(raw) ? raw : [];
}

export function pickPrimaryImage(images: InventoryImage[]): InventoryImage | null {
  if (!images.length) return null;
  return images.find((x) => x.IsPrimary) ?? images[0] ?? null;
}


export async function createDraftItemUploads(
  req: CreateDraftRequest
): Promise<CreateDraftResponse> {
  return apiPost<CreateDraftResponse>("/api/items/drafts", req);
}

export async function addItemImages(
  inventoryId: number,
  images: Array<{ ImagePath: string; IsPrimary?: boolean; SortOrder?: number }>
) {
  return apiPost(`/api/items/${inventoryId}/images`, { images });
}

export async function aiPrefillItem(
  inventoryId: number,
  opts: { overwrite?: boolean; maxImages?: number } = {}
) {
  const { overwrite = true, maxImages = 2 } = opts;
  return apiPost(`/api/items/${inventoryId}/ai-prefill`, {
    overwrite,
    maxImages,
  });
}

export async function refreshVectors(
  inventoryId: number,
  opts: { purpose?: string; force?: boolean } = {}
) {
  const { purpose = "item_text", force = false } = opts;
  return apiPost(`/api/items/${inventoryId}/vectors/refresh`, { purpose, force });
}

/** Upload helper (works with either casing since it uses DraftUpload you pass in) */
export async function putBlobFromUpload(upload: DraftUpload, bytes: ArrayBuffer) {
  const headers = new Headers();
  for (const [k, v] of Object.entries(upload.RequiredHeaders ?? {})) headers.set(k, v);
  if (!headers.has("Content-Type")) headers.set("Content-Type", upload.ContentType);

  const res = await fetch(upload.UploadUrl, {
    method: "PUT",
    headers,
    body: Buffer.from(bytes),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Blob PUT failed ${res.status}: ${await res.text()}`);
}
