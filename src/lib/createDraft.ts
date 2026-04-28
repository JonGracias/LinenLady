// /lib/createDraft.ts

import type { CreateDraftRequest, CreateDraftResponse, DraftPipelineOptions, DraftPipelineResult } from "@/types/inventory";

const ROUTES = {
  create:       "/admin/api/draft/create",
  blobUpload:   "/admin/api/draft/blob-upload",
  aiVision:     "/admin/api/draft/ai-vision",
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

export async function createDraftFrom(
  form: FormData,
  options: DraftPipelineOptions = {}
): Promise<DraftPipelineResult> {
  const keys = {
    TitleHint: options.Keys?.TitleHint ?? "titleHint",
    Notes:     options.Keys?.Notes     ?? "Notes",
    Files:     options.Keys?.Files     ?? "files",
  };

  const TitleHint = getString(form, keys.TitleHint);
  const Notes     = getString(form, keys.Notes);
  const Files     = getFiles(form, keys.Files);

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
      FileName:    f.name,
      ContentType: f.type || "application/octet-stream",
    })),
  };

  const draft = await postJson<CreateDraftResponse>(ROUTES.create, createReq);

  if (!draft?.inventoryId) {
    throw new Error("Draft create response missing InventoryId.");
  }
  if (!Array.isArray(draft.uploads) || draft.uploads.length !== Files.length) {
    throw new Error(
      `Draft create returned Uploads (${draft?.uploads?.length ?? 0}) that do not match file count (${Files.length}).`
    );
  }

  // ---------------------------------------------------------------------------
  // 2) /api/draft/blob-upload
  //     - PUT the blobs to Azure (SAS) + write DB image rows
  //     - We send FormData: "draft" JSON + "files" (same count/order as Uploads)
  // ---------------------------------------------------------------------------
  const uploadForm = new FormData();
  uploadForm.append("draft", JSON.stringify(draft));
  for (const f of Files) uploadForm.append("files", f);

  const blobUploadResult = await postForm<unknown>(ROUTES.blobUpload, uploadForm);

  // ---------------------------------------------------------------------------
  // 3) /api/draft/ai-vision
  //     - Scans images, writes name + description back to the item
  //     - Must complete before keywords step so the text is in the DB
  // ---------------------------------------------------------------------------
  let aiVisionResult: unknown | undefined;
  const runAiVision = options.RunAiVision ?? true;
  if (runAiVision) {
    aiVisionResult = await postJson(ROUTES.aiVision, {
      InventoryId: draft.inventoryId,
      overwrite:   options.AiVision?.Overwrite ?? false,
      maxImages:   options.AiVision?.MaxImages ?? Math.min(4, Files.length),
      TitleHint,
      Notes,
    });
  }

  // ---------------------------------------------------------------------------
  // 4) /api/draft/ai-embeddings
  //     - Generates and stores the vector for this item
  // ---------------------------------------------------------------------------
/*   let AiEmbeddingsResult: unknown | undefined;
  const runAiEmbeddings = options.RunAiEmbeddings ?? true;
  if (runAiEmbeddings) {
    AiEmbeddingsResult = await postJson(ROUTES.aiEmbeddings, {
      InventoryId: Draft.InventoryId,
    });
  } */

  // ---------------------------------------------------------------------------
  // 5) /api/items/[id]/keywords/generate
  //     - Generates structured keywords + SEO from name, description, notes
  //     - Also refreshes the vector so keywords are baked in
  //     - Non-fatal: a failure here does not fail the whole draft creation
  // ---------------------------------------------------------------------------
  let aiKeywordsResult: unknown | undefined;
  const runAiKeywords = options.RunAiKeywords ?? true;
  if (runAiKeywords) {
    try {
      aiKeywordsResult = await postJson(
        `/admin/api/items/${draft.inventoryId}/keywords/generate`,
        {}
      );
    } catch (err) {
      // Keywords are non-critical — draft is usable without them
      console.warn("Keywords generation failed (non-fatal):", err);
    }
  }

  return { draft, blobUploadResult, aiVisionResult, /* AiEmbeddingsResult */ aiKeywordsResult };
}