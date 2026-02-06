// /lib/createDraft.ts

import type { CreateDraftRequest, CreateDraftResponse, DraftPipelineOptions, DraftPipelineResult } from "@/types/inventory";

const ROUTES = {
  create: "/admin/api/draft/create",
  blobUpload: "/admin/api/draft/blob-upload",
  aiVision: "/admin/api/draft/ai-vision",
  aiEmbeddings: "/admin/api/draft/ai-embeddings",
} as const;

//-----------------------------------------------------------------------------------------//

function getString(form: FormData, key: string): string | undefined {
  const v = form.get(key);
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim();
  return trimmed.length ? trimmed : undefined;
}

function getFiles(form: FormData, key: string): File[] {
  return form.getAll(key).filter((v): v is File => v instanceof File);
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`POST ${url} failed (${res.status}): ${text || res.statusText}`);
  }

  return (await res.json()) as T;
}

//-----------------------------------------------------------------------------------------//

async function postForm<T>(url: string, form: FormData): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    cache: "no-store",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`POST ${url} failed (${res.status}): ${text || res.statusText}`);
  }

  return (await res.json().catch(() => ({}))) as T;
}

/**
 * Main orchestration: pass the *original* FormData from your component form.
 * Expected by default:
 *  - titleHint: string
 *  - notes: string
 *  - files: File[] (from <input type="file" name="files" multiple />)
 */

export async function createDraftFromForm(
  form: FormData,
  options: DraftPipelineOptions = {}
): Promise<DraftPipelineResult> {
  const keys = {
    TitleHint: options.Keys?.TitleHint ?? "titleHint",
    Notes: options.Keys?.Notes ?? "Notes",
    Files: options.Keys?.Files ?? "files",
  };

  const TitleHint = getString(form, keys.TitleHint);
  const Notes = getString(form, keys.Notes);
  const Files = getFiles(form, keys.Files);

  if (Files.length === 0) {
    throw new Error(`No files found in FormData under key "${keys.Files}".`);
  }

  // ---------------------------------------------------------------------------
  // 1) /api/draft/create (gets InventoryId + Uploads with SAS URLs + headers)
  // ---------------------------------------------------------------------------
  const createReq: CreateDraftRequest = {
    TitleHint,
    Notes,
    Files: Files.map((f) => ({
      FileName: f.name,
      ContentType: f.type || "application/octet-stream",
    })),
  };

  const Draft = await postJson<CreateDraftResponse>(ROUTES.create, createReq);

  if (!Draft?.InventoryId) {
    throw new Error("Draft create response missing InventoryId.");
  }
  if (!Array.isArray(Draft.Uploads) || Draft.Uploads.length !== Files.length) {
    throw new Error(
      `Draft create returned Uploads (${Draft?.Uploads?.length ?? 0}) that do not match file count (${Files.length}).`
    );
  }

  // ---------------------------------------------------------------------------
  // 2) /api/draft/blob-upload
  //     - This route should: PUT the blobs to Azure (SAS) + write DB image rows
  //     - We send FormData: "draft" JSON + "files" (same count/order as Uploads)
  // ---------------------------------------------------------------------------
  const uploadForm = new FormData();
  uploadForm.append("draft", JSON.stringify(Draft));
  for (const f of Files) uploadForm.append("files", f);

  const BlobUploadResult = await postForm<unknown>(ROUTES.blobUpload, uploadForm);

  // ---------------------------------------------------------------------------
  // 4) /api/draft/ai-vision
  // ---------------------------------------------------------------------------
  let AiVisionResult: unknown | undefined;
  const runAiVision = options.RunAiVision ?? true;
  if (runAiVision) {
    AiVisionResult = await postJson(ROUTES.aiVision, {
      InventoryId: Draft.InventoryId,
      overwrite: options.AiVision?.Overwrite ?? false,
      maxImages: options.AiVision?.MaxImages ?? Math.min(4, Files.length),
      TitleHint,
      Notes,
    });
  }

  // ---------------------------------------------------------------------------
  // 5) /api/draft/ai-embeddings
  // ---------------------------------------------------------------------------
  let AiEmbeddingsResult: unknown | undefined;
  const runAiEmbeddings = options.RunAiEmbeddings ?? true;
  if (runAiEmbeddings) {
    AiEmbeddingsResult = await postJson(ROUTES.aiEmbeddings, {
      InventoryId: Draft.InventoryId,
    });
  }

  return { Draft, BlobUploadResult, AiVisionResult, AiEmbeddingsResult };
}
