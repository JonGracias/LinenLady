// src/app/admin/media/page.tsx
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ImageEditorModal } from "@/components/shared/ImageEditorModal";

type SiteMediaItem = {
  MediaId:       number;
  Name:          string;
  BlobPath:      string;
  ReadUrl:       string | null;
  FileSizeBytes: number | null;
  UploadedAt:    string;
};

export default function AdminMediaPage() {
  const [items,      setItems]      = useState<SiteMediaItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [uploading,  setUploading]  = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [file,       setFile]       = useState<File | null>(null);
  const [preview,    setPreview]    = useState<string | null>(null);
  const [error,      setError]      = useState<string | null>(null);
  const [deleting,   setDeleting]   = useState<number | null>(null);
  const [editing,    setEditing]    = useState<SiteMediaItem | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/admin/api/site/media");
      const data = res.ok ? await res.json() : [];
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f) {
      setUploadName((n) => n || f.name.replace(/\.[^.]+$/, ""));
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const uploadBlob = async (blob: Blob, name: string, fileName: string, contentType: string) => {
    const createRes = await fetch("/admin/api/site/media", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Name:          name,
        FileName:      fileName,
        ContentType:   contentType,
        FileSizeBytes: blob.size,
      }),
    });
    if (!createRes.ok) throw new Error("Failed to create media record.");
    const { UploadUrl } = await createRes.json();

    const uploadRes = await fetch(UploadUrl, {
      method:  "PUT",
      headers: { "x-ms-blob-type": "BlockBlob", "Content-Type": contentType },
      body:    blob,
    });
    if (!uploadRes.ok) throw new Error("Failed to upload to storage.");
  };

  const handleUpload = async () => {
    if (!file || !uploadName.trim()) { setError("Please choose a file and enter a name."); return; }
    setError(null);
    setUploading(true);
    try {
      await uploadBlob(file, uploadName.trim(), file.name, file.type || "image/jpeg");
      setFile(null);
      setPreview(null);
      setUploadName("");
      if (fileRef.current) fileRef.current.value = "";
      await load();
    } catch (e: any) {
      setError(e.message ?? "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this photo? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await fetch(`/admin/api/site/media/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((m) => m.MediaId !== id));
    } finally {
      setDeleting(null);
    }
  };

  // Called by ImageEditorModal when user hits "Save to Library"
  const handleEditorSave = async (blob: Blob, name: string) => {
    await uploadBlob(blob, name, `${name}.jpg`, "image/jpeg");
    await load();
  };

  return (
    <div className=" p-8" style={{ background: "#111", color: "rgba(255,255,255,0.85)" }}>
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-10">
          <div className="ll-label mb-2 text-[0.6rem] font-medium uppercase tracking-[0.25em]" style={{ color: "rgba(255,255,255,0.3)" }}>
            Admin · Site
          </div>
          <h1 className="ll-display font-normal" style={{ fontSize: "2rem", color: "rgba(255,255,255,0.9)" }}>
            Media Library
          </h1>
          <p className="ll-body mt-1 text-sm font-light" style={{ color: "rgba(255,255,255,0.35)" }}>
            Upload and manage site photos. Click any photo to edit it.
          </p>
        </div>

        {/* Upload panel */}
        <div className="mb-10 p-6" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="ll-label mb-4 text-[0.62rem] font-medium uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.35)" }}>
            Upload New Photo
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="shrink-0 overflow-hidden" style={{ width: 100, height: 100, background: "#242424", border: "1px solid rgba(255,255,255,0.08)" }}>
              {preview
                ? <img src={preview} alt="preview" className="h-full w-full object-cover" />
                : <div className="flex h-full w-full items-center justify-center text-3xl opacity-20">🖼</div>
              }
            </div>
            <div className="flex flex-1 flex-col gap-3">
              <input
                type="text"
                placeholder="Photo name…"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                className="ll-body w-full bg-transparent px-3 py-2 text-sm outline-none placeholder:italic"
                style={{ color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.1)", caretColor: "var(--rose-light)" }}
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="ll-label text-[0.65rem] text-white/50 file:mr-3 file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-[0.6rem] file:uppercase file:tracking-widest file:text-white/70 hover:file:bg-white/20"
              />
              {error && (
                <div className="ll-label text-[0.62rem] uppercase tracking-[0.1em]" style={{ color: "#e07070" }}>{error}</div>
              )}
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading || !file}
              className="ll-label shrink-0 px-6 py-3 text-[0.65rem] font-medium uppercase tracking-[0.15em] transition-all disabled:opacity-30"
              style={{ background: "var(--rose-deep, #b07878)", color: "#fff", border: "none" }}
            >
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="ll-label py-20 text-center text-[0.65rem] uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.2)" }}>
            Loading…
          </div>
        ) : items.length === 0 ? (
          <div className="ll-label py-20 text-center text-[0.65rem] uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.2)" }}>
            No photos yet — upload one above.
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
            {items.map((item) => (
              <div
                key={item.MediaId}
                className="group relative overflow-hidden"
                style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }}
              >
                {/* Thumbnail — click to edit */}
                <div
                  className="aspect-square overflow-hidden relative"
                  style={{ background: "#242424" }}
                  onClick={() => setEditing(item)}
                >
                  {item.ReadUrl
                    ? <img src={item.ReadUrl} alt={item.Name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    : <div className="flex h-full w-full items-center justify-center text-4xl opacity-20">🖼</div>
                  }
                  {/* Edit hint on hover */}
                  <div
                    className="absolute inset-0 flex items-center justify-center transition-opacity duration-200 opacity-0 group-hover:opacity-100"
                    style={{ background: "rgba(0,0,0,0.45)" }}
                  >
                    <span className="ll-label text-[0.6rem] uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.9)" }}>
                      ✎ Edit
                    </span>
                  </div>
                </div>

                {/* Name + delete */}
                <div className="flex items-center justify-between px-3 py-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="ll-label truncate text-[0.6rem] uppercase tracking-[0.1em]" style={{ color: "rgba(255,255,255,0.55)" }}>
                    {item.Name}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(item.MediaId); }}
                    disabled={deleting === item.MediaId}
                    className="ll-label ml-2 shrink-0 text-[0.65rem] opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity disabled:opacity-30"
                    style={{ color: "#e07070", background: "none", border: "none" }}
                  >
                    {deleting === item.MediaId ? "…" : "✕"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image editor modal */}
      <ImageEditorModal
        open={!!editing}
        src={editing?.ReadUrl ?? null}
        fileName={editing?.Name ?? ""}
        onClose={() => setEditing(null)}
        onSave={handleEditorSave}
      />
    </div>
  );
}