// /components/admin/itemIntake.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createDraftFromForm } from "@/lib/createDraft";
import { Upload, X, Image as ImageIcon } from "lucide-react";

import { useDraftJobs } from "@/context/DraftJobsContext";
import { useToast } from "@/context/ToastHost";
import { useInventoryContext } from "@/context/InventoryContext";

type PhotoItem = {
  id: string;
  file: File;
  previewUrl: string;
  sig: string; // name|size|lastModified
};

function makeSig(f: File) {
  return `${f.name}|${f.size}|${f.lastModified}`;
}

function makeId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function isImage(file: File) {
  return typeof file.type === "string" && file.type.startsWith("image/");
}

export default function PhotoIntakePage() {
  const router = useRouter();

  const { startJob, pendingCount, allDone } = useDraftJobs();
  const { toast } = useToast();
  const { reloadItems } = useInventoryContext();

  const [items, setItems] = useState<PhotoItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // "starting" only prevents double-submit clicks; does NOT block selecting next batch
  const [starting, setStarting] = useState(false);

  // "finishing" drives the overlay when user clicks Done uploading
  const [finishing, setFinishing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const count = items.length;
  const canSubmit = !starting && count >= 1 && count <= 4;

  // revoke all URLs on unmount
  useEffect(() => {
    return () => {
      for (const it of items) URL.revokeObjectURL(it.previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addFiles(rawFiles: FileList | File[]) {
    if (finishing) return; // don’t allow new selection while finishing overlay is up

    setError(null);

    const incoming = Array.from(rawFiles);
    const imageFiles = incoming.filter(isImage);

    if (imageFiles.length === 0) {
      setError("No valid images selected. Only image/* files are allowed.");
      return;
    }

    setItems((prev) => {
      const prevSigs = new Set(prev.map((x) => x.sig));
      const next: PhotoItem[] = [...prev];

      for (const f of imageFiles) {
        if (next.length >= 4) break;

        const sig = makeSig(f);
        if (prevSigs.has(sig)) continue;

        const previewUrl = URL.createObjectURL(f);
        next.push({
          id: makeId(),
          file: f,
          previewUrl,
          sig,
        });
        prevSigs.add(sig);
      }

      if (next.length === prev.length) {
        if (prev.length >= 4) {
          setError("You already have 4 photos selected. Remove one to add another.");
        } else {
          setError("No new images were added (duplicates are ignored).");
        }
      }

      return next;
    });
  }

  function onPickClick() {
    if (finishing) return;
    setError(null);
    fileInputRef.current?.click();
  }

  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const fl = e.target.files;
    if (!fl) return;
    addFiles(fl);
    e.target.value = ""; // allow re-picking the same file
  }

  function removeOne(id: string) {
    if (finishing) return;

    setItems((prev) => {
      const idx = prev.findIndex((x) => x.id === id);
      if (idx === -1) return prev;

      const it = prev[idx];
      URL.revokeObjectURL(it.previewUrl);

      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
  }

  function clearAll() {
    setItems((prev) => {
      for (const it of prev) URL.revokeObjectURL(it.previewUrl);
      return [];
    });
    setError(null);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (finishing) return;

    const dt = e.dataTransfer;
    if (!dt?.files?.length) return;

    addFiles(dt.files);
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setStarting(true);
    setError(null);

    // Snapshot current selection BEFORE clearing UI
    const snapshot = items.slice();
    const label = snapshot.map((x) => x.file.name).join(", ");

    // Clear UI immediately (non-blocking intake)
    clearAll();

    // Kick off background job (don’t await)
    startJob(label, async () => {
      try {
        const form = new FormData();
        for (const it of snapshot) form.append("files", it.file);

        const result = await createDraftFromForm(form);
        const inventoryId = Number(result?.Draft?.InventoryId);

        if (!Number.isFinite(inventoryId)) {
          throw new Error("Draft pipeline completed but InventoryId was missing.");
        }

        toast("success", `Draft created (#${inventoryId})`);
        reloadItems(); // refresh list cache so /admin/items shows it immediately

        return { inventoryId };
      } catch (err: any) {
        toast("error", `Draft failed: ${err?.message ?? "Unknown error"}`);
        throw err;
      }
    });

    setStarting(false);
  }

  function onDoneUploading() {
    if (allDone) {
      router.push("/admin/items");
      return;
    }
    setFinishing(true);
  }

  useEffect(() => {
    if (finishing && allDone) {
      router.push("/admin/items");
    }
  }, [finishing, allDone, router]);

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Photo Intake</h1>
        <p className="mt-2 text-gray-600">
          Upload 1–4 images to create a new draft. Duplicates will be automatically ignored.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex-shrink-0">
            <X className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-red-900">Error</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
            aria-label="Dismiss error"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Dropzone */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          className={`
            relative rounded-xl border-2 border-dashed p-8 text-center transition-all
            ${finishing ? "border-gray-200 bg-gray-50 cursor-not-allowed" : "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50 cursor-pointer"}
          `}
          onClick={!finishing && count < 4 ? onPickClick : undefined}
        >
          <div className="flex flex-col items-center gap-4">
            <div className={`rounded-full p-4 ${finishing ? "bg-gray-100" : "bg-blue-50"}`}>
              <Upload className={`h-8 w-8 ${finishing ? "text-gray-400" : "text-blue-600"}`} />
            </div>

            <div>
              <p className="text-lg font-medium text-gray-900">
                {count >= 4 ? "Maximum photos reached" : "Drag & drop photos here"}
              </p>
              <p className="mt-1 text-sm text-gray-600">or click to browse • {count}/4 selected</p>
              <p className="mt-2 text-xs text-gray-500">PNG, JPG, GIF, WEBP accepted</p>
            </div>

            <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                name="files"
                className="hidden"
                onChange={onFileInputChange}
                disabled={finishing}
              />
              <button
                type="button"
                onClick={onPickClick}
                disabled={finishing || count >= 4}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Choose Files
              </button>
              {count > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={finishing}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Preview Grid */}
        {items.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {items.map((it) => (
              <div
                key={it.id}
                className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="aspect-square overflow-hidden bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={it.previewUrl}
                    alt={it.file.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>

                <div className="p-3">
                  <p className="truncate text-xs font-medium text-gray-700" title={it.file.name}>
                    {it.file.name}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {(it.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeOne(it.id)}
                  disabled={finishing}
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-gray-600 shadow-md hover:bg-white hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all backdrop-blur-sm"
                  title="Remove photo"
                  aria-label={`Remove ${it.file.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {items.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-3 text-sm font-medium text-gray-900">No photos selected</p>
            <p className="mt-1 text-sm text-gray-600">Upload your first photo to get started</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-2">
            {pendingCount > 0 ? (
              <>
                <div className="h-2 w-2 animate-pulse rounded-full bg-blue-600"></div>
                <span className="text-sm font-medium text-gray-700">
                  Processing {pendingCount} job(s) in background
                </span>
              </>
            ) : (
              <>
                <div className={`h-2 w-2 rounded-full ${count > 0 ? "bg-green-500" : "bg-gray-300"}`}></div>
                <span className="text-sm text-gray-600">
                  {count > 0 ? `${count} photo${count > 1 ? "s" : ""} ready` : "Ready to upload"}
                </span>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onDoneUploading}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Done uploading
            </button>

            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow"
            >
              {starting ? "Starting..." : "Create Draft"}
            </button>
          </div>
        </div>
      </form>

      {/* Finishing Overlay */}
      {finishing && !allDone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
              <div>
                <div className="font-medium text-gray-900">Finishing uploads…</div>
                <div className="text-sm text-gray-600">{pendingCount} job(s) still running</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
