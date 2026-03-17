// src/components/shared/ImageEditorModal.tsx
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

type Props = {
  open:       boolean;
  src:        string | null;         // image URL to edit
  fileName:   string;
  onClose:    () => void;
  onSave:     (blob: Blob, name: string) => Promise<void>;
};

type Mode = "crop" | "resize";

function centerInitialCrop(width: number, height: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, width / height, width, height),
    width,
    height
  );
}

export function ImageEditorModal({ open, src, fileName, onClose, onSave }: Props) {
  const imgRef    = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [mode,      setMode]      = useState<Mode>("crop");
  const [crop,      setCrop]      = useState<Crop>();
  const [rotate,    setRotate]    = useState(0);   // degrees, multiple of 90
  const [flipH,     setFlipH]     = useState(false);
  const [flipV,     setFlipV]     = useState(false);
  const [resizeW,   setResizeW]   = useState("");
  const [resizeH,   setResizeH]   = useState("");
  const [lockAR,    setLockAR]    = useState(true);
  const [origW,     setOrigW]     = useState(0);
  const [origH,     setOrigH]     = useState(0);
  const [saving,    setSaving]    = useState(false);
  const [saveName,  setSaveName]  = useState("");
  const [preview,   setPreview]   = useState<string | null>(null);

  // Reset when opened
  useEffect(() => {
    if (open) {
      setCrop(undefined);
      setRotate(0);
      setFlipH(false);
      setFlipV(false);
      setResizeW("");
      setResizeH("");
      setLockAR(true);
      setPreview(null);
      setSaveName(fileName.replace(/\.[^.]+$/, "") + "-edited");
    }
  }, [open, fileName]);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    setOrigW(w);
    setOrigH(h);
    setResizeW(String(w));
    setResizeH(String(h));
    setCrop(centerInitialCrop(w, h));
  };

  // Resize width change — maintain aspect ratio if locked
  const handleResizeW = (val: string) => {
    setResizeW(val);
    if (lockAR && origW && origH) {
      const n = parseInt(val);
      if (!isNaN(n)) setResizeH(String(Math.round(n * origH / origW)));
    }
  };

  const handleResizeH = (val: string) => {
    setResizeH(val);
    if (lockAR && origW && origH) {
      const n = parseInt(val);
      if (!isNaN(n)) setResizeW(String(Math.round(n * origW / origH)));
    }
  };

  // Photoshop-style preset buttons
  const presets = [
    { label: "½",   fn: () => { setResizeW(String(Math.round(origW / 2))); setResizeH(String(Math.round(origH / 2))); } },
    { label: "¼",   fn: () => { setResizeW(String(Math.round(origW / 4))); setResizeH(String(Math.round(origH / 4))); } },
    { label: "2×",  fn: () => { setResizeW(String(origW * 2)); setResizeH(String(origH * 2)); } },
    { label: "1:1", fn: () => { const s = Math.min(origW, origH); setResizeW(String(s)); setResizeH(String(s)); } },
    { label: "Original", fn: () => { setResizeW(String(origW)); setResizeH(String(origH)); } },
  ];

  const renderToCanvas = useCallback((): HTMLCanvasElement | null => {
    const img = imgRef.current;
    if (!img) return null;

    const canvas = document.createElement("canvas");
    const ctx    = canvas.getContext("2d");
    if (!ctx) return null;

    const targetW = mode === "resize" ? (parseInt(resizeW) || origW) : origW;
    const targetH = mode === "resize" ? (parseInt(resizeH) || origH) : origH;

    // Account for rotation swapping dimensions
    const isRotated90 = rotate % 180 !== 0;
    canvas.width  = isRotated90 ? targetH : targetW;
    canvas.height = isRotated90 ? targetW : targetH;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(img, -targetW / 2, -targetH / 2, targetW, targetH);
    ctx.restore();

    // Apply crop in crop mode
    if (mode === "crop" && crop && crop.width && crop.height) {
      const scaleX = img.naturalWidth  / img.width;
      const scaleY = img.naturalHeight / img.height;

      const cropX = (crop.unit === "%" ? (crop.x / 100) * img.naturalWidth  : crop.x * scaleX);
      const cropY = (crop.unit === "%" ? (crop.y / 100) * img.naturalHeight : crop.y * scaleY);
      const cropW = (crop.unit === "%" ? (crop.width  / 100) * img.naturalWidth  : crop.width  * scaleX);
      const cropH = (crop.unit === "%" ? (crop.height / 100) * img.naturalHeight : crop.height * scaleY);

      const croppedCanvas  = document.createElement("canvas");
      croppedCanvas.width  = cropW;
      croppedCanvas.height = cropH;
      const cCtx = croppedCanvas.getContext("2d")!;
      cCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      return croppedCanvas;
    }

    return canvas;
  }, [crop, rotate, flipH, flipV, resizeW, resizeH, origW, origH, mode]);

  const handlePreview = () => {
    const c = renderToCanvas();
    if (c) setPreview(c.toDataURL("image/jpeg", 0.92));
  };

  const handleSave = async () => {
    const c = renderToCanvas();
    if (!c) return;
    setSaving(true);
    try {
      const blob = await new Promise<Blob>((res, rej) =>
        c.toBlob((b) => b ? res(b) : rej(new Error("Canvas error")), "image/jpeg", 0.92)
      );
      await onSave(blob, saveName);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (!open || !src) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex flex-col overflow-hidden w-full"
        style={{
          maxWidth:   900,
          maxHeight:  "90vh",
          background: "#161616",
          border:     "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <span className="ll-label text-[0.65rem] uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.4)" }}>
            Image Editor
          </span>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.35)", background: "none", border: "none", fontSize: "1.1rem" }}>✕</button>
        </div>

        {/* ── Toolbar ── */}
        <div
          className="flex flex-wrap items-center gap-3 px-5 py-3 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#1a1a1a" }}
        >
          {/* Mode tabs */}
          {(["crop", "resize"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="ll-label px-4 py-1.5 text-[0.6rem] uppercase tracking-[0.15em] transition-colors"
              style={{
                background: mode === m ? "rgba(176,120,120,0.2)" : "transparent",
                border:     `1px solid ${mode === m ? "rgba(176,120,120,0.5)" : "rgba(255,255,255,0.1)"}`,
                color:      mode === m ? "var(--rose-light, #e8c4c4)" : "rgba(255,255,255,0.45)",
              }}
            >
              {m}
            </button>
          ))}

          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)" }} />

          {/* Rotate */}
          <button
            onClick={() => setRotate((r) => (r - 90 + 360) % 360)}
            className="ll-label px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.12em] transition-colors hover:bg-white/5"
            style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", background: "none" }}
            title="Rotate left 90°"
          >
            ↺ 90°
          </button>
          <button
            onClick={() => setRotate((r) => (r + 90) % 360)}
            className="ll-label px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.12em] transition-colors hover:bg-white/5"
            style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", background: "none" }}
            title="Rotate right 90°"
          >
            ↻ 90°
          </button>

          {/* Flip */}
          <button
            onClick={() => setFlipH((f) => !f)}
            className="ll-label px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.12em] transition-colors"
            style={{
              border:     "1px solid rgba(255,255,255,0.1)",
              background: flipH ? "rgba(176,120,120,0.15)" : "none",
              color:      flipH ? "var(--rose-light, #e8c4c4)" : "rgba(255,255,255,0.5)",
            }}
          >
            ⇔ Flip H
          </button>
          <button
            onClick={() => setFlipV((f) => !f)}
            className="ll-label px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.12em] transition-colors"
            style={{
              border:     "1px solid rgba(255,255,255,0.1)",
              background: flipV ? "rgba(176,120,120,0.15)" : "none",
              color:      flipV ? "var(--rose-light, #e8c4c4)" : "rgba(255,255,255,0.5)",
            }}
          >
            ⇕ Flip V
          </button>
        </div>

        {/* ── Resize controls (shown when in resize mode) ── */}
        {mode === "resize" && (
          <div
            className="flex flex-wrap items-center gap-4 px-5 py-3 shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#181818" }}
          >
            {/* W × H inputs */}
            <div className="flex items-center gap-2">
              <span className="ll-label text-[0.58rem] uppercase tracking-[0.12em]" style={{ color: "rgba(255,255,255,0.35)" }}>W</span>
              <input
                type="number"
                value={resizeW}
                onChange={(e) => handleResizeW(e.target.value)}
                className="ll-body w-20 bg-transparent px-2 py-1 text-sm outline-none text-center"
                style={{ color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.12)" }}
              />
              <span className="ll-label text-[0.55rem]" style={{ color: "rgba(255,255,255,0.25)" }}>px</span>
            </div>

            {/* Lock aspect ratio */}
            <button
              onClick={() => setLockAR((l) => !l)}
              title={lockAR ? "Unlock aspect ratio" : "Lock aspect ratio"}
              className="flex h-7 w-7 items-center justify-center transition-colors"
              style={{
                border:     "1px solid rgba(255,255,255,0.12)",
                background: lockAR ? "rgba(176,120,120,0.15)" : "transparent",
                color:      lockAR ? "var(--rose-light, #e8c4c4)" : "rgba(255,255,255,0.35)",
                fontSize:   "0.9rem",
              }}
            >
              {lockAR ? "🔒" : "🔓"}
            </button>

            <div className="flex items-center gap-2">
              <span className="ll-label text-[0.58rem] uppercase tracking-[0.12em]" style={{ color: "rgba(255,255,255,0.35)" }}>H</span>
              <input
                type="number"
                value={resizeH}
                onChange={(e) => handleResizeH(e.target.value)}
                className="ll-body w-20 bg-transparent px-2 py-1 text-sm outline-none text-center"
                style={{ color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.12)" }}
              />
              <span className="ll-label text-[0.55rem]" style={{ color: "rgba(255,255,255,0.25)" }}>px</span>
            </div>

            {/* Info */}
            {origW > 0 && (
              <span className="ll-label text-[0.58rem]" style={{ color: "rgba(255,255,255,0.2)" }}>
                Original: {origW} × {origH}
              </span>
            )}

            <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)" }} />

            {/* Preset buttons */}
            {presets.map(({ label, fn }) => (
              <button
                key={label}
                onClick={fn}
                className="ll-label px-3 py-1 text-[0.58rem] uppercase tracking-[0.1em] transition-colors hover:bg-white/5"
                style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)", background: "none" }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* ── Canvas / Preview area ── */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center" style={{ background: "#0e0e0e", minHeight: 300 }}>
          {preview ? (
            <div className="flex flex-col items-center gap-3">
              <span className="ll-label text-[0.6rem] uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.3)" }}>Preview</span>
              <img src={preview} alt="preview" style={{ maxWidth: "100%", maxHeight: 400, objectFit: "contain" }} />
            </div>
          ) : (
            <div style={{ maxWidth: "100%", maxHeight: 400, overflow: "auto" }}>
              {mode === "crop" ? (
                <ReactCrop
                  crop={crop}
                  onChange={(_, pct) => setCrop(pct)}
                  style={{ maxHeight: 400 }}
                >
                  <img
                    ref={imgRef}
                    src={src}
                    onLoad={onImageLoad}
                    alt="edit"
                    crossOrigin="anonymous"
                    style={{
                      maxWidth:  "100%",
                      maxHeight: 400,
                      transform: `rotate(${rotate}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                      transformOrigin: "center",
                    }}
                  />
                </ReactCrop>
              ) : (
                <img
                  ref={imgRef}
                  src={src}
                  onLoad={onImageLoad}
                  alt="edit"
                  crossOrigin="anonymous"
                  style={{
                    maxWidth:  "100%",
                    maxHeight: 400,
                    transform: `rotate(${rotate}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                    transformOrigin: "center",
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)", background: "#1a1a1a" }}
        >
          {/* Save name */}
          <div className="flex items-center gap-2">
            <span className="ll-label text-[0.58rem] uppercase tracking-[0.12em]" style={{ color: "rgba(255,255,255,0.3)" }}>Save as</span>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="ll-body bg-transparent px-2 py-1 text-sm outline-none"
              style={{ color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)", width: 200 }}
            />
          </div>

          <div className="flex gap-3">
            {preview && (
              <button
                onClick={() => setPreview(null)}
                className="ll-label px-4 py-2 text-[0.62rem] uppercase tracking-[0.15em] transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.45)", background: "none" }}
              >
                ← Back to Edit
              </button>
            )}
            {!preview && (
              <button
                onClick={handlePreview}
                className="ll-label px-4 py-2 text-[0.62rem] uppercase tracking-[0.15em] transition-colors hover:bg-white/5"
                style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)", background: "none" }}
              >
                Preview
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !saveName.trim()}
              className="ll-label px-6 py-2 text-[0.62rem] uppercase tracking-[0.15em] transition-all disabled:opacity-30"
              style={{ background: "var(--rose-deep, #b07878)", color: "#fff", border: "none" }}
            >
              {saving ? "Saving…" : "Save to Library"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}