// /components/admin/IntakePage.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createDraftFrom } from "@/lib/createDraft";
import { Upload, X, Image as ImageIcon, Camera, FolderOpen } from "lucide-react";
import { useDraftJobs } from "@/context/DraftJobsContext";
import { useToast } from "@/context/ToastHost";
import { useInventoryContext } from "@/context/InventoryContext";
import { CameraModal } from "@/components/admin/modals/CameraModal";
import { normalizeFile } from "@/lib/normalizeFile";

// ─── Shared types & helpers ───────────────────────────────────────────────────

type PhotoItem = {
  id: string;
  file: File;
  previewUrl: string;
  sig: string;
};

function makeSig(f: File) {
  return `${f.name}|${f.size}|${f.lastModified}`;
}

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function isImage(file: File) {
  const heic = file.type === "image/heic" || file.type === "image/heif"
    || file.name.toLowerCase().endsWith(".heic")
    || file.name.toLowerCase().endsWith(".heif");
  return heic || (typeof file.type === "string" && file.type.startsWith("image/"));
}
// ─── Main Component ───────────────────────────────────────────────────────────

export default function IntakePage() {
  const router = useRouter();
  const { startJob, pendingCount, allDone } = useDraftJobs();
  const { toast } = useToast();
  const { reloadItems } = useInventoryContext();

  const [photos, setPhotos]     = useState<PhotoItem[]>([]);
  const [error, setError]       = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const count     = photos.length;
  const canSubmit = !starting && count >= 1 && count <= 4;

  // ─── Camera capture ───────────────────────────────────────────────────────

  function handleCameraCapture(file: File) {
    setError(null);
    setPhotos((prev) => {
      if (prev.length >= 4) {
        setError("You already have 4 photos. Remove one to add another.");
        return prev;
      }
      const sig = makeSig(file);
      if (prev.some((x) => x.sig === sig)) return prev;
      return [...prev, { id: uid(), file, previewUrl: URL.createObjectURL(file), sig }];
    });
  }

  // ─── File upload logic ────────────────────────────────────────────────────

  async function addFiles(rawFiles: FileList | File[]) {
    if (finishing) return;
    setError(null);

    const incoming = Array.from(rawFiles);
    const imageFiles = incoming.filter(isImage);

    if (imageFiles.length === 0) {
      setError("No valid images selected. Only image files are allowed.");
      return;
    }

    // Convert any HEIC files before touching state
    const normalized = await Promise.all(imageFiles.map(normalizeFile));

    setPhotos((prev) => {
      const prevSigs = new Set(prev.map((x) => x.sig));
      const next: PhotoItem[] = [...prev];

      for (const f of normalized) {
        if (next.length >= 4) break;
        const sig = makeSig(f);
        if (prevSigs.has(sig)) continue;
        next.push({ id: uid(), file: f, previewUrl: URL.createObjectURL(f), sig });
        prevSigs.add(sig);
      }

      if (next.length === prev.length) {
        setError(
          prev.length >= 4
            ? "You already have 4 photos. Remove one to add another."
            : "No new images added (duplicates ignored)."
        );
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
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (finishing) return;
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  // ─── Shared actions ───────────────────────────────────────────────────────

  function removePhoto(id: string) {
    if (finishing) return;
    setPhotos((prev) => {
      const idx = prev.findIndex((x) => x.id === id);
      if (idx === -1) return prev;
      URL.revokeObjectURL(prev[idx].previewUrl);
      const next = prev.slice();
      next.splice(idx, 1);
      return next;
    });
  }

  function clearAll() {
    setPhotos((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      return [];
    });
    setError(null);
  }

  async function submitDraft(e?: React.FormEvent) {
    e?.preventDefault();
    if (!canSubmit) return;

    setStarting(true);
    setError(null);

    const snapshot = photos.slice();
    const label    = snapshot.map((x) => x.file.name).join(", ");

    clearAll();

    startJob(label, async () => {
      try {
        const form = new FormData();
        for (const it of snapshot) form.append("files", it.file);

        const result      = await createDraftFrom(form);
        const inventoryId = Number(result?.draft?.inventoryId);

        if (!Number.isFinite(inventoryId)) {
          throw new Error("Draft pipeline completed but inventoryId was missing.");
        }

        toast("success", `Draft created (#${inventoryId})`);
        reloadItems();
        return { inventoryId };
      } catch (err: any) {
        toast("error", `Draft failed: ${err?.message ?? "Unknown error"}`);
        throw err;
      }
    });

    setStarting(false);
  }

  function onCancel() {
    router.push("/admin/items");
  }

  function onDoneUploading() {
    if (photos.length > 0) {
      submitDraft();
    }

    if (allDone && photos.length === 0) {
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

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-4xl p-6">

      {/* Error Alert */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <X className="h-5 w-5 flex-shrink-0 text-red-600" />
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

      <form onSubmit={submitDraft} className="space-y-6">

        {/* ─── Drop zone ───────────────────────────────────────────────────── */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          className={[
            "relative rounded-xl border-2 border-dashed p-8 text-center transition-all",
            finishing
              ? "border-gray-200 bg-gray-50 cursor-not-allowed"
              : count >= 4
              ? "border-gray-200 bg-gray-50"
              : "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50 cursor-pointer",
          ].join(" ")}
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
              <p className="mt-1 text-sm text-gray-600">
                or use the buttons below • {count}/4 selected
              </p>
              <p className="mt-2 text-xs text-gray-500">PNG, JPG, HEIC, WEBP accepted</p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.heic,.heif"
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
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FolderOpen className="h-4 w-4" />
                Browse files
              </button>

              <button
                type="button"
                onClick={() => setCameraOpen(true)}
                disabled={finishing || count >= 4}
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Camera className="h-4 w-4" />
                Use camera
              </button>

              {count > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={finishing}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─── Preview Grid ─────────────────────────────────────────────────── */}
        {photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4">
            {photos.map((it) => (
              <div
                key={it.id}
                className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="aspect-square overflow-hidden bg-gray-100">
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
                  onClick={() => removePhoto(it.id)}
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

        {/* ─── Empty state ──────────────────────────────────────────────────── */}
        {photos.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-3 text-sm font-medium text-gray-900">No photos selected</p>
            <p className="mt-1 text-sm text-gray-600">
              Browse files or use the camera to get started
            </p>
          </div>
        )}

        {/* ─── Footer ───────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-2">
            {pendingCount > 0 ? (
              <>
                <div className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
                <span className="text-sm font-medium text-gray-700">
                  Processing {pendingCount} job(s) in background
                </span>
              </>
            ) : (
              <>
                <div className={`h-2 w-2 rounded-full ${count > 0 ? "bg-green-500" : "bg-gray-300"}`} />
                <span className="text-sm text-gray-600">
                  {count > 0 ? `${count} photo${count > 1 ? "s" : ""} ready` : "Ready to upload"}
                </span>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow"
            >
              {starting ? "Starting..." : "Next"}
            </button>
            <button
              type="button"
              onClick={onDoneUploading}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Finish
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>

      {/* Camera modal */}
      <CameraModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      {/* Finishing overlay */}
      {finishing && !allDone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
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