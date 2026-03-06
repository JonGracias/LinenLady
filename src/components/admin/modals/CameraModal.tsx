// src/components/admin/modals/CameraModal.tsx
// Live camera capture modal using getUserMedia.
// Works on iOS Safari, Android Chrome, and desktop browsers.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  open:    boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
};

type CameraState = "requesting" | "live" | "preview" | "error";

export function CameraModal({ open, onClose, onCapture }: Props) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);

  const [state, setState]       = useState<CameraState>("requesting");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

  /* ── Start / stop stream ── */
  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startStream = useCallback(async (facing: "environment" | "user") => {
    stopStream();
    setState("requesting");
    setErrorMsg(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setState("live");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Camera access denied.";
      setErrorMsg(
        msg.includes("Permission") || msg.includes("NotAllowed")
          ? "Camera permission denied. Please allow camera access in your browser settings."
          : msg.includes("NotFound") || msg.includes("DevicesNotFound")
          ? "No camera found on this device."
          : `Could not start camera: ${msg}`
      );
      setState("error");
    }
  }, [stopStream]);

  /* ── Open/close lifecycle ── */
  useEffect(() => {
    if (open) {
      setPreviewUrl(null);
      setCapturedBlob(null);
      startStream(facingMode);
    } else {
      stopStream();
      setState("requesting");
      setPreviewUrl(null);
      setCapturedBlob(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* ── Cleanup on unmount ── */
  useEffect(() => () => stopStream(), [stopStream]);

  /* ── Capture frame ── */
  const handleCapture = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      setCapturedBlob(blob);
      setPreviewUrl(canvas.toDataURL("image/jpeg", 0.92));
      stopStream();
      setState("preview");
    }, "image/jpeg", 0.92);
  }, [stopStream]);

  /* ── Retake ── */
  const handleRetake = useCallback(() => {
    setPreviewUrl(null);
    setCapturedBlob(null);
    startStream(facingMode);
  }, [startStream, facingMode]);

  /* ── Flip camera ── */
  const handleFlip = useCallback(() => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    startStream(next);
  }, [facingMode, startStream]);

  /* ── Use photo ── */
  const handleUse = useCallback(() => {
    if (!capturedBlob) return;
    const file = new File([capturedBlob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
    onCapture(file);
    onClose();
  }, [capturedBlob, onCapture, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/60 absolute top-0 left-0 right-0 z-10">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Cancel
        </button>

        <span className="text-sm font-medium text-white">
          {state === "preview" ? "Use this photo?" : "Take photo"}
        </span>

        {/* Flip camera button — only when live */}
        {state === "live" ? (
          <button
            onClick={handleFlip}
            className="rounded-md p-1.5 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Flip camera"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        ) : (
          <div className="w-9" /> // spacer to keep title centred
        )}
      </div>

      {/* Viewfinder / preview */}
      <div className="flex-1 flex items-center justify-center bg-black overflow-hidden">

        {/* Live video */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`h-full w-full object-cover ${state === "live" ? "block" : "hidden"}`}
        />

        {/* Captured preview */}
        {state === "preview" && previewUrl && (
          <img src={previewUrl} alt="Captured" className="h-full w-full object-contain" />
        )}

        {/* Requesting / error state */}
        {(state === "requesting" || state === "error") && (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            {state === "requesting" ? (
              <>
                <svg className="h-8 w-8 animate-spin text-white/40" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <p className="text-sm text-white/60">Starting camera…</p>
              </>
            ) : (
              <>
                <svg className="h-10 w-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm text-white/60">{errorMsg}</p>
                <button
                  onClick={() => startStream(facingMode)}
                  className="mt-2 rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20 transition-colors"
                >
                  Try again
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 px-6 py-8 bg-black/60">
        {state === "live" && (
          /* Shutter button */
          <button
            onClick={handleCapture}
            className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/20 hover:bg-white/30 active:scale-95 transition-all"
            aria-label="Capture photo"
          >
            <div className="h-10 w-10 rounded-full bg-white" />
          </button>
        )}

        {state === "preview" && (
          <>
            <button
              onClick={handleRetake}
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-medium text-white hover:bg-white/20 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retake
            </button>
            <button
              onClick={handleUse}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Use photo
            </button>
          </>
        )}
      </div>

      {/* Off-screen canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}