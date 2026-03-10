// src/components/admin/ThumbnailStrip.tsx
"use client";

import { useRef, useState } from "react";
import type { InventoryImage } from "@/types/inventory";
import { CameraModal } from "@/components/admin/modals/CameraModal";
import { normalizeFile } from "@/lib/normalizeFile";

async function convertAndAdd(files: FileList, onAddPhotos: (f: FileList) => void) {
  const normalized = await Promise.all(Array.from(files).map(normalizeFile));
  const dt = new DataTransfer();
  normalized.forEach((f) => dt.items.add(f));
  onAddPhotos(dt.files);
}

type Props = {
  images:          InventoryImage[];
  activeImageId:   number | null;
  primaryImageId:  number | null;
  addingPhotos:    boolean;
  uploadError:     string | null;
  onThumbnailClick:  (imageId: number) => void;
  onSetPrimary:      (imageId: number) => void;
  onEditImage:       () => void;
  onAddPhotos:       (files: FileList) => void;
  onDeleteImage:     (imageId: number) => void;
  settingPrimary:    number | null;
};

type SlideFull = InventoryImage & { ReadUrl: string };

function isFull(img: InventoryImage): img is SlideFull {
  return typeof img.ReadUrl === "string" && img.ReadUrl.length > 0;
}

export function ThumbnailStrip({
  images,
  activeImageId,
  primaryImageId,
  addingPhotos,
  uploadError,
  onThumbnailClick,
  onSetPrimary,
  onEditImage,
  onAddPhotos,
  onDeleteImage,
  settingPrimary,
}: Props) {
  const [addMenuOpen, setAddMenuOpen]               = useState(false);
  const [cameraOpen, setCameraOpen]                 = useState(false);
  const [confirmDeleteImageId, setConfirmDeleteImageId] = useState<number | null>(null);
  const [deletingImageId, setDeletingImageId]       = useState<number | null>(null);

  const addInputRef  = useRef<HTMLInputElement>(null);
  const addMenuRef   = useRef<HTMLDivElement>(null);

  const slides = images.filter(isFull);
  const activeImage  = slides.find((img) => img.ImageId === activeImageId) ?? null;
  const activeIsPrimary = activeImage?.ImageId === primaryImageId;

  // Click-outside for add menu
  const handleMenuToggle = () => {
    if (addingPhotos) return;
    setAddMenuOpen((v) => !v);
  };

  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
      setAddMenuOpen(false);
    }
  };

  const handleCameraCapture = (file: File) => {
    const dt = new DataTransfer();
    dt.items.add(file);
    onAddPhotos(dt.files);
  };

  const handleDeleteConfirm = async (imageId: number) => {
    setDeletingImageId(imageId);
    setConfirmDeleteImageId(null);
    await onDeleteImage(imageId);
    setDeletingImageId(null);
  };

  const addButtonCls = [
    "flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all",
    addingPhotos
      ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 opacity-50 cursor-wait"
      : addMenuOpen
        ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20"
        : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20",
  ].join(" ");

  const addMenuDropdown = addMenuOpen && !addingPhotos && (
    <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-20 w-36 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
      <button
        onClick={() => { setAddMenuOpen(false); addInputRef.current?.click(); }}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <svg className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h3.5l2 2.5H19a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
        </svg>
        Browse files
      </button>
      <div className="border-t border-gray-100 dark:border-gray-700" />
      <button
        onClick={() => { setAddMenuOpen(false); setCameraOpen(true); }}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <svg className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Use camera
      </button>
    </div>
  );

  const addSpinner = (
    <svg className="h-5 w-5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );

  const addIcon = (size: "sm" | "lg") => (
    <>
      <svg
        className={`${size === "sm" ? "h-5 w-5" : "h-6 w-6"} text-gray-400 dark:text-gray-500`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      <span className={`${size === "sm" ? "mt-0.5 text-[9px]" : "text-xs"} text-gray-400 dark:text-gray-500`}>
        {size === "sm" ? "Add" : "Add photos"}
      </span>
    </>
  );

  return (
    // Outer click handler closes the menu on outside click
    <div className="flex  items-center justify-between" onClick={handleOutsideClick}>

      {/* ── Thumbnails row ── */}
      {slides.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {slides.map((img) => {
            const isActive           = img.ImageId === activeImageId;
            const isPrimary          = img.ImageId === primaryImageId;
            const isConfirmingDelete = img.ImageId === confirmDeleteImageId;
            const isDeletingThis     = img.ImageId === deletingImageId;

            return (
              <div key={img.ImageId} className="relative">
                <button
                  onClick={() => onThumbnailClick(img.ImageId)}
                  className={[
                    "group relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                    isActive
                      ? "border-blue-500 opacity-100"
                      : "border-gray-300 dark:border-gray-600 opacity-70 hover:border-gray-400 dark:hover:border-gray-400 hover:opacity-100",
                  ].join(" ")}
                >
                  <img src={img.ReadUrl} alt="" className="h-full w-full object-cover" />
                  {isPrimary && (
                    <div className="absolute right-1 top-1">
                      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500 shadow">
                        <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                  {isDeletingThis && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
                      <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    </div>
                  )}
                </button>

                {/* Delete X / confirm */}
                {isActive && !isDeletingThis && (
                  isConfirmingDelete ? (
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-1 whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteConfirm(img.ImageId)}
                        className="rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white hover:bg-red-600"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmDeleteImageId(null)}
                        className="rounded bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteImageId(img.ImageId); }}
                      className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gray-800 dark:bg-gray-900 border border-gray-600 text-gray-300 hover:bg-red-600 hover:border-red-500 hover:text-white transition-colors"
                      aria-label="Delete image"
                    >
                      <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )
                )}
              </div>
            );
          })}

          {/* Add button (inline) */}
          <div ref={addMenuRef} className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleMenuToggle}
              disabled={addingPhotos}
              className={`${addButtonCls} h-14 w-14`}
            >
              {addingPhotos ? addSpinner : addIcon("sm")}
            </button>
            {addMenuDropdown}
            <input ref={addInputRef} type="file" accept="image/*,.heic,.heif" multiple className="hidden"
              disabled={addingPhotos} onChange={(e) => { if (e.target.files) convertAndAdd(e.target.files, onAddPhotos); }} />
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {slides.length === 0 && (
        <div ref={addMenuRef} className="relative flex w-full max-w-xs flex-col items-center" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleMenuToggle}
            disabled={addingPhotos}
            className={`${addButtonCls} h-24 w-full flex-col gap-2`}
          >
            {addingPhotos ? addSpinner : addIcon("lg")}
          </button>
          {addMenuOpen && !addingPhotos && (
            <div className="absolute top-full mt-1.5 z-20 w-36 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
              <button
                onClick={() => { setAddMenuOpen(false); addInputRef.current?.click(); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h3.5l2 2.5H19a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                </svg>
                Browse files
              </button>
              <div className="border-t border-gray-100 dark:border-gray-700" />
              <button
                onClick={() => { setAddMenuOpen(false); setCameraOpen(true); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Use camera
              </button>
            </div>
          )}
          <input ref={addInputRef} type="file" accept="image/*,.heic,.heif" multiple className="hidden"
            disabled={addingPhotos} onChange={(e) => { if (e.target.files) convertAndAdd(e.target.files, onAddPhotos); }} />
        </div>
      )}

      {/* Upload error */}
      {uploadError && (
        <p className="text-xs text-red-500 dark:text-red-400">{uploadError}</p>
      )}

      {/* ── Action row ── */}
      {activeImage && (
        <div className="flex h-8 items-center justify-center gap-3 mt-5">
          {!activeIsPrimary ? (
            <button
              onClick={() => onSetPrimary(activeImage.ImageId)}
              disabled={settingPrimary !== null}
              className="flex items-center gap-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 transition-colors hover:border-green-500 hover:bg-green-50 hover:text-green-700 dark:hover:border-green-600 dark:hover:bg-green-900/30 dark:hover:text-green-300 disabled:opacity-50"
            >
              {settingPrimary === activeImage.ImageId ? (
                <>
                  <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Saving…
                </>
              ) : (
                <>
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Make primary
                </>
              )}
            </button>
          ) : (
            <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Primary image
            </span>
          )}

          <button
            onClick={onEditImage}
            className="flex items-center gap-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 transition-colors hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 dark:hover:border-blue-500 dark:hover:bg-blue-900/30 dark:hover:text-blue-300"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit image
          </button>
        </div>
      )}

      <CameraModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
}