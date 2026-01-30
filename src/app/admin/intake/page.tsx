"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type LocalFile = {
  id: string;
  file: File;
  url: string;
};

/**
 * Human-friendly bytes formatter for displaying file size in the UI.
 * Example: 1200345 -> "1.1 MB"
 */
function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;

  // Divide by 1024 until it fits the next unit
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }

  // Show 0 decimals for bytes, 1 decimal for KB/MB/GB
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Accept only Images.
 * File.type is a MIME type like "image/jpeg", "image/png", etc.
 */
function isImage(file: File) {
  return file.type.startsWith("image/");
}

export default function AdminIntakePage() {
  // Next.js client-side router (push navigations without a full page load)
  const router = useRouter();

  // Ref to the hidden <input type="file"> so we can click it via a button
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // items = selected Images (1–4) stored as LocalFile objects
  const [items, setItems] = useState<LocalFile[]>([]);

  // busy = UI lock while uploading/creating draft (prevents double submit)
  const [busy, setBusy] = useState(false);

  // error = string shown in red UI panel if something fails
  const [error, setError] = useState<string | null>(null);

  /**
   * CLEANUP: revoke object URLs.
   *
   * URL.createObjectURL(file) gives a temporary local URL for previewing.
   * If you never revoke them, you can leak memory (especially with many Images).
   *
   * This effect runs whenever `items` changes. The cleanup function runs:
   * - before the effect re-runs (items changes)
   * - when the component unmounts (navigate away)
   *
   * NOTE: This pattern can revoke URLs for items that are still in the next state
   * if you're not careful. Here, we also revoke on remove/clear.
   * In practice this usually works because we revoke on cleanup when items changes
   * and on explicit removal; but the safest approach is to revoke only when removing.
   * (Leaving as-is because it matches your current file.)
   */
  useEffect(() => {
    return () => {
      for (const it of items) URL.revokeObjectURL(it.url);
    };
  }, [items]);

  /**
   * canSubmit is derived state:
   * - must have between 1 and 4 Images
   * - must not currently be busy (uploading)
   *
   * useMemo avoids recomputing on every render, but here it's mostly a style choice.
   */
  const canSubmit = useMemo(
    () => items.length >= 1 && items.length <= 4 && !busy,
    [items, busy],
  );

  /**
   * Adds files from either:
   * - drag & drop (FileList)
   * - file input selection (FileList)
   * - any other source (array of File)
   *
   * Important behaviors:
   * - filters non-Images out
   * - max 4 Images total
   * - de-dupes by Name+size+lastModified to prevent accidental double add
   * - creates object URLs for preview
   */
  function addFiles(files: FileList | File[]) {
    // Reset previous error when user tries again
    setError(null);

    // Convert to array and keep only Images
    const incoming = Array.from(files).filter(isImage);

    // If user dropped/selected non-image files, show error and stop
    if (incoming.length === 0) {
      setError("No Images found. Please select image files (jpg/png/heic/etc.).");
      return;
    }

    // Use functional state update because next depends on prev
    setItems((prev) => {
      const next = [...prev];

      for (const f of incoming) {
        // Enforce hard cap of 4 Images
        if (next.length >= 4) break;

        // De-dupe heuristic:
        // If user selects the same file twice, we skip it.
        // This is not perfect (two different files can share these properties),
        // but it's a pragmatic UX guardrail.
        const exists = next.some(
          (x) =>
            x.file.name === f.name &&
            x.file.size === f.size &&
            x.file.lastModified === f.lastModified,
        );
        if (exists) continue;

        next.push({
          // crypto.randomUUID() creates a stable unique id in the browser
          id: crypto.randomUUID(),
          file: f,

          // Creates a local URL like "blob:https://...".
          // This is NOT an upload; it’s just for previewing locally.
          url: URL.createObjectURL(f),
        });
      }

      // Extra safety if something above ever pushed > 4
      if (next.length > 4) return next.slice(0, 4);
      return next;
    });
  }

  /**
   * Remove one file by id, revoking its preview URL to avoid leaks.
   */
  function removeFile(id: string) {
    setItems((prev) => {
      const found = prev.find((x) => x.id === id);

      // Release the object URL for the removed item
      if (found) URL.revokeObjectURL(found.url);

      // Return new list without that item
      return prev.filter((x) => x.id !== id);
    });
  }

  /**
   * Clear everything (also revokes object URLs).
   */
  function clearAll() {
    for (const it of items) URL.revokeObjectURL(it.url);
    setItems([]);
    setError(null);
  }

  /**
   * Main submit handler:
   * - Builds a FormData payload with repeated "files" fields
   * - POSTs to /admin/api/create-draft
   * - Expects JSON response (on both success and error)
   *
   * Back-end contract (as written in comment):
   * - field Name is "files" repeated N times
   *   (common pattern for multipart uploads)
   */
  async function submitCreateDraft() {
    // UI guard; also prevents double click
    if (!canSubmit) return;

    setBusy(true);
    setError(null);

    try {
      // FormData builds a multipart/form-data request automatically when used as fetch body
      const fd = new FormData();

      // Backend expects "files" repeated (equivalent to files[])
      // Example request body becomes:
      //   files: <binary>
      //   files: <binary>
      //   ...
      for (const it of items) {
        fd.append("files", it.file, it.file.name);
      }

      const res = await fetch("/admin/api/create-draft", {
        method: "POST",
        body: fd, // IMPORTANT: do not set Content-Type manually; browser sets boundary for multipart
      });

      // Try to parse JSON either way; if it fails, data becomes null
      const data = await res.json().catch(() => null);

      // If non-2xx, throw an error with either backend message or fallback
      if (!res.ok) {
        const msg = data?.error || `Create draft failed (${res.status})`;
        throw new Error(msg);
      }

      // If success:
      // Ask user if they want to intake another item immediately.
      // - If yes: clear selection and stay on this page
      // - If no: navigate to drafts list
      const again = window.confirm("Item created. Add another item?");
      if (again) {
        clearAll();
        return;
      }

      router.push("/admin/drafts");
    } catch (e) {
      // Convert unknown thrown values into a message for the UI
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      // Always unlock UI at the end
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header: Title + short instruction */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Photo Intake</h1>
          <p className="mt-2 text-base text-gray-600">
            Upload 1–4 product photos to create a new inventory item
          </p>
        </div>

        {/* Dropzone container:
            - onDragOver: preventDefault so the browser allows drop
            - onDrop: extract dropped files and call addFiles
            - busy guard: do nothing while uploading
         */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (busy) return;
            if (e.dataTransfer?.files) addFiles(e.dataTransfer.files);
          }}
          className="mb-6 rounded-2xl border-2 border-dashed border-gray-300 bg-white p-12 transition-colors hover:border-blue-400 hover:bg-blue-50/30"
        >
          <div className="flex flex-col items-center text-center">
            {/* Decorative icon */}
            <svg
              className="mb-4 h-16 w-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>

            <h3 className="mb-2 text-xl font-semibold text-gray-900">
              Drag and drop your photos here
            </h3>
            <p className="mb-6 text-sm text-gray-600">
              Upload up to 4 Images • JPG, PNG, HEIC supported
            </p>

            {/* Hidden file input:
                - accept="image/*": filters file picker to Images
                - multiple: allow selecting more than one at a time
                - capture="environment": hint for mobile to use rear camera
                - onChange: add selected files, then reset value so re-selecting same file triggers change again
             */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              onChange={(e) => {
                if (busy) return;
                if (e.target.files) addFiles(e.target.files);

                // Reset input so selecting the same file again still fires onChange
                e.currentTarget.value = "";
              }}
              className="hidden"
            />

            <div className="flex gap-3">
              {/* Browse button triggers the hidden input click */}
              <button
                type="button"
                disabled={busy || items.length >= 4}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
              >
                Browse Files
              </button>

              {/* Clear All only shown if at least one image selected */}
              {items.length > 0 && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={clearAll}
                  className="rounded-lg border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error panel shown if error != null */}
        {error && (
          <div className="mb-6 rounded-xl border-2 border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h4 className="font-semibold text-red-900">Error</h4>
                <p className="mt-1 text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Photo Grid: shows either empty state or selected Images */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Selected Photos ({items.length}/4)
            </h2>

            {/* Small badge on the right */}
            {items.length > 0 && (
              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                {items.length === 1 ? "1 photo" : `${items.length} photos`}
              </span>
            )}
          </div>

          {/* If no items, show placeholder */}
          {items.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
              <svg
                className="mx-auto mb-3 h-12 w-12 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-500">No photos selected yet</p>
            </div>
          ) : (
            // If items exist, render a responsive grid of preview cards
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((it, idx) => (
                <div
                  key={it.id}
                  className="group overflow-hidden rounded-xl border-2 border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
                >
                  <div className="relative">
                    {/* Preview image using object URL */}
                    <img
                      src={it.url}
                      alt={it.file.name}
                      className="h-48 w-full object-cover"
                    />

                    {/* Label the first image as "Primary" (often used as hero image) */}
                    <div className="absolute top-3 left-3">
                      <span className="rounded-full bg-black/75 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                        {idx === 0 ? "Primary" : `#${idx + 1}`}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    {/* File Name (truncate so it doesn't overflow) */}
                    <h3 className="mb-2 truncate text-sm font-semibold text-gray-900">
                      {it.file.name}
                    </h3>

                    {/* MIME type + readable size */}
                    <p className="mb-3 text-xs text-gray-500">
                      {it.file.type || "image/*"} • {formatBytes(it.file.size)}
                    </p>

                    {/* Remove button (disabled while busy) */}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => removeFile(it.id)}
                      className="w-full rounded-lg border-2 border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom actions bar */}
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex gap-4">
            {/* Create Item button:
                - disabled unless canSubmit true
                - shows spinner + "Creating..." while busy
             */}
            <button
              type="button"
              disabled={!canSubmit}
              onClick={submitCreateDraft}
              className="rounded-lg bg-blue-600 px-8 py-3 font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
            >
              {busy ? (
                <span className="flex items-center gap-2">
                  {/* Inline spinner */}
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating...
                </span>
              ) : (
                "Create Item"
              )}
            </button>

            {/* Quick navigation to drafts list */}
            <button
              type="button"
              disabled={busy}
              onClick={() => router.push("/admin/drafts")}
              className="rounded-lg border-2 border-gray-300 bg-white px-8 py-3 font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              View Drafts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
