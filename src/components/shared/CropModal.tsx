// src/components/shared/CropModal.tsx
// Opens automatically after file selection.
// Shows a locked 21:9 crop box the user drags to choose what's in frame.
// On confirm, returns a cropped JPEG File.
"use client";

import React, { useCallback, useRef, useState } from "react";
import ReactCrop, {
  type Crop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

const ASPECT = 21 / 9;

type Props = {
  open:     boolean;
  src:      string | null;      // object URL of the file
  fileName: string;
  onConfirm:(file: File) => void;
  onCancel: () => void;
};

function initCrop(width: number, height: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, ASPECT, width, height),
    width,
    height
  );
}

export function CropModal({ open, src, fileName, onConfirm, onCancel }: Props) {
  const imgRef  = useRef<HTMLImageElement>(null);
  const [crop,  setCrop]    = useState<Crop>();
  const [ready, setReady]   = useState(false);
  const [working, setWorking] = useState(false);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    setCrop(initCrop(w, h));
    setReady(true);
  };

  const handleConfirm = useCallback(async () => {
    const img = imgRef.current;
    if (!img || !crop?.width || !crop?.height) return;
    setWorking(true);

    try {
      const scaleX = img.naturalWidth  / img.width;
      const scaleY = img.naturalHeight / img.height;

      const cropX = crop.unit === "%" ? (crop.x / 100) * img.naturalWidth  : crop.x * scaleX;
      const cropY = crop.unit === "%" ? (crop.y / 100) * img.naturalHeight : crop.y * scaleY;
      const cropW = crop.unit === "%" ? (crop.width  / 100) * img.naturalWidth  : crop.width  * scaleX;
      const cropH = crop.unit === "%" ? (crop.height / 100) * img.naturalHeight : crop.height * scaleY;

      const canvas   = document.createElement("canvas");
      canvas.width   = Math.round(cropW);
      canvas.height  = Math.round(cropH);
      const ctx      = canvas.getContext("2d")!;
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      const blob = await new Promise<Blob>((res, rej) =>
        canvas.toBlob((b) => b ? res(b) : rej(new Error("toBlob failed")), "image/jpeg", 0.92)
      );

      const name = fileName.replace(/\.[^.]+$/, "") + ".jpg";
      onConfirm(new File([blob], name, { type: "image/jpeg" }));
    } finally {
      setWorking(false);
    }
  }, [crop, fileName, onConfirm]);

  if (!open || !src) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="flex flex-col overflow-hidden w-full"
        style={{
          maxWidth:   900,
          maxHeight:  "92vh",
          background: "#161616",
          border:     "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div>
            <span
              className="ll-label text-[0.65rem] uppercase tracking-[0.2em]"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Crop to 21:9
            </span>
            <span
              className="ll-label ml-3 text-[0.58rem] uppercase tracking-[0.12em]"
              style={{ color: "rgba(255,255,255,0.2)" }}
            >
              Drag the box to choose what&apos;s in frame
            </span>
          </div>
          <button
            onClick={onCancel}
            style={{ color: "rgba(255,255,255,0.3)", background: "none", border: "none", fontSize: "1.1rem", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>

        {/* Crop area */}
        <div
          className="flex-1 overflow-auto flex items-center justify-center p-4"
          style={{ background: "#0e0e0e", minHeight: 260 }}
        >
          <ReactCrop
            crop={crop}
            onChange={(_, pct) => setCrop(pct)}
            aspect={ASPECT}
            style={{ maxWidth: "100%", maxHeight: "70vh" }}
          >
            <img
              ref={imgRef}
              src={src}
              onLoad={onImageLoad}
              crossOrigin="anonymous"
              alt="crop preview"
              style={{ maxWidth: "100%", maxHeight: "70vh", display: "block" }}
            />
          </ReactCrop>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)", background: "#1a1a1a" }}
        >
          <span
            className="ll-label text-[0.58rem] uppercase tracking-[0.12em]"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            Aspect ratio locked to 21:9 · Output will be JPEG
          </span>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="ll-label px-5 py-2 text-[0.62rem] uppercase tracking-[0.15em] transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.45)", background: "none", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!ready || working}
              className="ll-label px-6 py-2 text-[0.62rem] uppercase tracking-[0.15em] transition-all disabled:opacity-30"
              style={{ background: "var(--rose-deep, #b07878)", color: "#fff", border: "none", cursor: "pointer" }}
            >
              {working ? "Processing…" : "Use This Crop →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}