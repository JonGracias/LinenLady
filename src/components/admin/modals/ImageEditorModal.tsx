// src/components/admin/modals/ImageEditorModal.tsx
"use client";

import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";

/* ──────────────────────────────────────────────────────────────
   Canvas helper — fixed rotation + brightness/contrast
────────────────────────────────────────────────────────────── */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src     = src;
  });
}

async function renderToBlob(
  imageSrc:   string,
  cropArea:   Area,   // pixels in original image space (pre-rotation)
  rotation:   number,
  flipH:      boolean,
  flipV:      boolean,
  brightness: number, // 0-200, 100 = normal
  contrast:   number, // 0-200, 100 = normal
): Promise<Blob> {
  const image = await loadImage(imageSrc);

  // ── Step 1: draw full image onto a temp canvas with rotation + flip ──
  // The bounding box of the rotated image may be larger than the original.
  const rad    = (rotation * Math.PI) / 180;
  const sinA   = Math.abs(Math.sin(rad));
  const cosA   = Math.abs(Math.cos(rad));
  const rotW   = Math.round(image.width * cosA + image.height * sinA);
  const rotH   = Math.round(image.width * sinA + image.height * cosA);

  const rotCanvas    = document.createElement("canvas");
  rotCanvas.width    = rotW;
  rotCanvas.height   = rotH;
  const rotCtx       = rotCanvas.getContext("2d")!;

  rotCtx.translate(rotW / 2, rotH / 2);
  rotCtx.rotate(rad);
  rotCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  rotCtx.drawImage(image, -image.width / 2, -image.height / 2);
  rotCtx.setTransform(1, 0, 0, 1, 0, 0); // reset

  // ── Step 2: crop from the rotated canvas using cropArea coordinates ──
  // react-easy-crop's cropArea is in the rotated image's pixel space
  // when rotation != 0, so we need to offset into the rotated bounding box.
  const offsetX = (rotW - image.width)  / 2;
  const offsetY = (rotH - image.height) / 2;

  const cropCanvas    = document.createElement("canvas");
  cropCanvas.width    = Math.round(cropArea.width);
  cropCanvas.height   = Math.round(cropArea.height);
  const cropCtx       = cropCanvas.getContext("2d")!;

  cropCtx.drawImage(
    rotCanvas,
    Math.round(cropArea.x + offsetX),
    Math.round(cropArea.y + offsetY),
    Math.round(cropArea.width),
    Math.round(cropArea.height),
    0, 0,
    Math.round(cropArea.width),
    Math.round(cropArea.height),
  );

  // ── Step 3: apply brightness/contrast on a fresh canvas ──
  // ctx.filter must be set before drawImage with no active transforms.
  if (brightness !== 100 || contrast !== 100) {
    const filterCanvas    = document.createElement("canvas");
    filterCanvas.width    = cropCanvas.width;
    filterCanvas.height   = cropCanvas.height;
    const filterCtx       = filterCanvas.getContext("2d")!;
    filterCtx.filter      = `brightness(${brightness}%) contrast(${contrast}%)`;
    filterCtx.drawImage(cropCanvas, 0, 0);
    filterCtx.filter      = "none";

    return new Promise<Blob>((resolve, reject) => {
      filterCanvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
        "image/jpeg", 0.92,
      );
    });
  }

  return new Promise<Blob>((resolve, reject) => {
    cropCanvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/jpeg", 0.92,
    );
  });
}

/* ──────────────────────────────────────────────────────────────
   Props
────────────────────────────────────────────────────────────── */

type Props = {
  open:     boolean;
  imageUrl: string;
  onClose:  () => void;
  onSave:   (blob: Blob) => Promise<void>;
};

/* ──────────────────────────────────────────────────────────────
   Component
────────────────────────────────────────────────────────────── */

export function ImageEditorModal({ open, imageUrl, onClose, onSave }: Props) {
  const [crop, setCrop]                           = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom]                           = useState(1);
  const [rotation, setRotation]                   = useState(0);
  const [flipH, setFlipH]                         = useState(false);
  const [flipV, setFlipV]                         = useState(false);
  const [brightness, setBrightness]               = useState(100);
  const [contrast, setContrast]                   = useState(100);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving]                       = useState(false);
  const [error, setError]                         = useState<string | null>(null);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setSaving(true);
    setError(null);
    try {
      const blob = await renderToBlob(
        imageUrl, croppedAreaPixels, rotation, flipH, flipV, brightness, contrast,
      );
      await onSave(blob);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save image.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setBrightness(100);
    setContrast(100);
    setError(null);
  };

  if (!open) return null;

  const iconBtn    = "flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors";
  const flipActive = "border-blue-500 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300";
  const flipIdle   = "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="flex w-full max-w-2xl flex-col rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Edit Image</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Crop area */}
        <div className="relative h-72 w-full bg-black sm:h-80">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={undefined}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{ containerStyle: { background: "#000" } }}
          />
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4 px-5 py-4">

          {/* Row 1: Rotate + Flip */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-12 text-xs text-gray-400 dark:text-gray-500">Rotate</span>
              <button onClick={() => setRotation((r) => r - 90)} className={iconBtn} aria-label="Rotate left 90°">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <button onClick={() => setRotation((r) => r + 90)} className={iconBtn} aria-label="Rotate right 90°">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
              <span className="w-8 text-xs tabular-nums text-gray-400 dark:text-gray-500">{rotation}°</span>
            </div>

            <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />

            <div className="flex items-center gap-1.5">
              <span className="w-6 text-xs text-gray-400 dark:text-gray-500">Flip</span>
              <button
                onClick={() => setFlipH((v) => !v)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors ${flipH ? flipActive : flipIdle}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8M8 12h8M8 17h8M3 7l-1 5 1 5M21 7l1 5-1 5" />
                </svg>
                H
              </button>
              <button
                onClick={() => setFlipV((v) => !v)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors ${flipV ? flipActive : flipIdle}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 8v8M12 8v8M17 8v8M7 3l5-1 5 1M7 21l5 1 5-1" />
                </svg>
                V
              </button>
            </div>
          </div>

          {/* Row 2: Sliders */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
                <span>Zoom</span>
                <span className="tabular-nums">{zoom.toFixed(1)}×</span>
              </div>
              <input type="range" min={1} max={3} step={0.05}
                value={zoom} onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-blue-500" />
            </label>

            <label className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
                <span>Fine rotation</span>
                <span className="tabular-nums">{rotation}°</span>
              </div>
              <input type="range" min={-180} max={180} step={1}
                value={rotation} onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full accent-blue-500" />
            </label>

            <label className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
                <span>Brightness</span>
                <span className="tabular-nums">{brightness}%</span>
              </div>
              <input type="range" min={0} max={200} step={1}
                value={brightness} onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full accent-yellow-400" />
            </label>

            <label className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
                <span>Contrast</span>
                <span className="tabular-nums">{contrast}%</span>
              </div>
              <input type="range" min={0} max={200} step={1}
                value={contrast} onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full accent-purple-400" />
            </label>
          </div>

          {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 px-5 py-3">
          <button
            onClick={handleReset}
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Reset all
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Saving…
                </>
              ) : "Save"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}