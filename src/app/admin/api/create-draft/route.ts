// src/app/admin/api/create-draft/route.ts
import { NextResponse } from "next/server";
import {
  addItemImages,
  aiPrefillItem,
  createDraftItemUploads,
  putBlobFromUpload,
  refreshVectors,
} from "@/lib/linenladyapi";

export async function POST(req: Request) {
  // ============================================================================
  // STEP 0: VALIDATE REQUEST FORMAT
  // ============================================================================

  const ct = req.headers.get("content-type") ?? "";

  if (!ct.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Expected multipart/form-data with files[]" },
      { status: 400 },
    );
  }

  const form = await req.formData();
  const titleHint = (form.get("titleHint") as string | null) ?? undefined;
  const notes = (form.get("notes") as string | null) ?? undefined;
  const fileEntries = form.getAll("files");
  const files = fileEntries.filter((x): x is File => x instanceof File);

  if (files.length < 1) {
    return NextResponse.json({ error: "No files provided (files[])" }, { status: 400 });
  }
  if (files.length > 4) {
    return NextResponse.json({ error: "Max 4 files allowed" }, { status: 400 });
  }

  // ============================================================================
  // STEP 1: CREATE DRAFT ITEM & GET UPLOAD URLS
  // ============================================================================

  const draft = await createDraftItemUploads({
    titleHint,  // Optional: becomes the initial item Name
    notes,      // Optional: stored temporarily in Description field
    files: files.map((f) => ({
      fileName: f.name,                                 // e.g., "IMG_1234.jpg"
      contentType: f.type || "application/octet-stream", // e.g., "image/jpeg"
    })),
  });

  // ============================================================================
  // STEP 2: UPLOAD FILES TO AZURE BLOB STORAGE
  // ============================================================================
  
  for (let i = 0; i < draft.Uploads.length; i++) {
    const upload = draft.Uploads[i];
    const file = files[i];
    if (!file) break;  // Safety check (shouldn't happen if backend is correct)

    const bytes = await file.arrayBuffer();

    await putBlobFromUpload(upload, bytes);
  }

  // ============================================================================
  // STEP 3: LINK IMAGES TO INVENTORY ITEM
  // ============================================================================
 
  const imagesPayload = draft.Uploads.map((u, i) => ({
    ImagePath: u.BlobName,      // Where the image lives in Azure
    IsPrimary: i === 0,         // First image is the hero image
    SortOrder: i + 1,           // 1-based ordering (1=first, 2=second, etc.)
  }));

  const attached = await addItemImages(draft.InventoryId, imagesPayload);

  // ============================================================================
  // STEP 4: AI-POWERED AUTO-FILL
  // ============================================================================

  const ai = await aiPrefillItem(draft.InventoryId, { 
    overwrite: true,  // Replace existing AI content (if any)
    maxImages: 2      // Only analyze first 2 photos (cost optimization)
  });

  // ============================================================================
  // STEP 5: GENERATE VECTOR EMBEDDINGS FOR SEARCH
  // ============================================================================
  
  const vectors = await refreshVectors(draft.InventoryId, { 
    purpose: "item_text",  // Vectorizing text (not images)
    force: false           // Skip if vectors already exist
  });

  // ============================================================================
  // STEP 6: RETURN SUCCESS RESPONSE
  // ============================================================================
  
  return NextResponse.json({
    inventoryId: draft.InventoryId,  // Database primary key
    publicId: draft.PublicId,         // User-facing ID (used in URLs)
    sku: draft.Sku,                   // Inventory code (starts with "DRAFT-")
    uploads: draft.Uploads.map((u) => ({ 
      index: u.Index,                 // Which image position (1-4)
      blobName: u.BlobName            // Where it's stored in Azure
    })),
    attached,  // Database records confirming image linkage
    ai,        // AI-generated product details
    vectors,   // Search embeddings for semantic matching
  });
}

