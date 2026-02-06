"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createDraftFromForm } from "@/lib/createDraft";
import { useDraftJobs } from "@/context/DraftJobsContext";
import { useToast } from "@/context/ToastHost";
import { useInventoryContext } from "@/context/InventoryContext";

type PhotoItem = {
  id: string;
  file: File;
  previewUrl: string;
};

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function CameraIntake() {
  const router = useRouter();
  const { startJob, pendingCount, allDone } = useDraftJobs();
  const { toast } = useToast();
  const { reloadItems } = useInventoryContext();

  // Camera
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Current item photos (1–4)
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // UI mode
  const [finishing, setFinishing] = useState(false);
  const [startingJob, setStartingJob] = useState(false);

  const canUseCamera = useMemo(() => {
    return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
  }, []);

  // Start/stop camera
  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      if (!canUseCamera) {
        setCameraError("Camera API not available in this browser/device.");
        return;
      }

      // Must be HTTPS (or localhost) on most mobile browsers
      // If blocked, user will see permission error.
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setCameraError(null);
      } catch (e: any) {
        setCameraError(e?.message ?? "Unable to access camera (permission denied or no camera).");
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      const s = streamRef.current;
      if (s) s.getTracks().forEach((t) => t.stop());
      streamRef.current = null;

      // revoke previews
      setPhotos((prev) => {
        prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
        return [];
      });
    };
  }, [canUseCamera]);

  function takePhoto() {
    const video = videoRef.current;
    if (!video) return;

    if (photos.length >= 4) return;

    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, w, h);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });
      const previewUrl = URL.createObjectURL(file);

      setPhotos((prev) => [...prev, { id: uid(), file, previewUrl }]);
    }, "image/jpeg", 0.92);
  }

  function removePhoto(id: string) {
    setPhotos((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === -1) return prev;

      URL.revokeObjectURL(prev[idx].previewUrl);
      const next = prev.slice();
      next.splice(idx, 1);
      return next;
    });
  }

  function clearCurrentItem() {
    setPhotos((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      return [];
    });
  }

  function startNewItemJob() {
    if (photos.length < 1) return;

    setStartingJob(true);

    const snapshot = photos.slice();
    const label = snapshot.map((p) => p.file.name).join(", ");

    // non-blocking: clear UI immediately
    clearCurrentItem();

    startJob(label, async () => {
      try {
        const form = new FormData();
        for (const p of snapshot) form.append("files", p.file);

        const result = await createDraftFromForm(form);
        const inventoryId = Number(result?.Draft?.InventoryId);

        if (!Number.isFinite(inventoryId)) {
          throw new Error("Draft pipeline completed but InventoryId was missing.");
        }

        toast("success", `Draft created (#${inventoryId})`);
        reloadItems(); // refresh cache for /admin/items
        return { inventoryId };
      } catch (err: any) {
        toast("error", `Draft failed: ${err?.message ?? "Unknown error"}`);
        throw err;
      }
    });

    setStartingJob(false);
  }

  function onFinish() {
    // If user still has photos staged, you can either:
    // A) force them to press "New Item" first, or
    // B) auto-start the last job.
    // Here we AUTO-START if staged photos exist.
    if (photos.length > 0) startNewItemJob();

    if (allDone) router.push("/admin/items");
    else setFinishing(true);
  }

  useEffect(() => {
    if (finishing && allDone) {
      router.push("/admin/items");
    }
  }, [finishing, allDone, router]);

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Camera Intake</h1>
        <p className="text-sm text-gray-600">
          Take 1–4 photos per item. Then choose: Take another picture, New Item, or Finish.
        </p>
      </div>

      {/* Camera area */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {cameraError ? (
          <div className="p-4">
            <div className="text-sm font-medium text-red-700">Camera not available</div>
            <div className="text-sm text-gray-700 mt-1">{cameraError}</div>
            <div className="text-xs text-gray-500 mt-2">
              Notes: mobile browsers usually require HTTPS (localhost is OK). Also check permissions.
            </div>
          </div>
        ) : (
          <div className="relative">
            <video ref={videoRef} className="w-full h-[360px] object-cover bg-black" playsInline muted />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3">
              <div className="text-xs text-white/90 bg-black/50 px-2 py-1 rounded">
                {photos.length}/4 photos staged • {pendingCount} job(s) running
              </div>
              <button
                type="button"
                onClick={takePhoto}
                disabled={photos.length >= 4}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-900 disabled:opacity-50"
              >
                Capture
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preview strip */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {photos.map((p) => (
            <div key={p.id} className="relative rounded-lg border border-gray-200 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.previewUrl} alt="preview" className="aspect-square w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(p.id)}
                className="absolute top-2 right-2 rounded-full bg-white/90 px-2 py-1 text-xs"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Choice buttons */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-gray-700">
          {pendingCount > 0 ? (
            <span className="font-medium">Processing {pendingCount} job(s) in background</span>
          ) : (
            <span>Ready</span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={takePhoto}
            disabled={!!cameraError || photos.length >= 4}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 disabled:opacity-50"
          >
            Take another picture
          </button>

          <button
            type="button"
            onClick={startNewItemJob}
            disabled={startingJob || photos.length === 0}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            New Item
          </button>

          <button
            type="button"
            onClick={onFinish}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800"
          >
            Finish
          </button>
        </div>
      </div>

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
