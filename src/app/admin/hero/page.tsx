// src/app/admin/hero/page.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { MediaPickerModal, type SiteMediaItem } from "@/components/shared/MediaPickerModal";
import { CropModal } from "@/components/shared/CropModal";

type HeroSlide = {
  slideId:   number;
  mediaId:   number | null;
  media:     SiteMediaItem | null;
  heading:   string | null;
  subtext:   string | null;
  linkUrl:   string | null;
  linkLabel: string | null;
  sortOrder: number;
  isActive:  boolean;
};

const EMPTY_FORM = {
  heading:   "",
  subtext:   "",
  linkUrl:   "",
  linkLabel: "",
  isActive:  true,
  mediaId:   null as number | null,
  media:     null as SiteMediaItem | null,
};

export default function AdminHeroPage() {
  const [slides,     setSlides]     = useState<HeroSlide[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [editingId,  setEditingId]  = useState<number | "new" | null>(null);
  const [form,       setForm]       = useState({ ...EMPTY_FORM });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // Crop modal
  const [cropOpen,    setCropOpen]    = useState(false);
  const [cropSrc,     setCropSrc]     = useState<string | null>(null);
  const [cropPending, setCropPending] = useState<SiteMediaItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/admin/api/site/hero");
      const data = res.ok ? await res.json() : [];
      setSlides(Array.isArray(data) ? data : []);
    } catch {
      setSlides([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew  = () => { setForm({ ...EMPTY_FORM }); setEditingId("new"); setError(null); };
  const openEdit = (slide: HeroSlide) => {
    setForm({
      heading:   slide.heading   ?? "",
      subtext:   slide.subtext   ?? "",
      linkUrl:   slide.linkUrl   ?? "",
      linkLabel: slide.linkLabel ?? "",
      isActive:  slide.isActive,
      mediaId:   slide.mediaId,
      media:     slide.media,
    });
    setEditingId(slide.slideId);
    setError(null);
  };
  const cancelEdit = () => { setEditingId(null); setError(null); };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const body = {
        mediaId:   form.mediaId,
        heading:   form.heading   || null,
        subtext:   form.subtext   || null,
        linkUrl:   form.linkUrl   || null,
        linkLabel: form.linkLabel || null,
        sortOrder: editingId === "new"
          ? (slides.length + 1) * 10
          : slides.find((s) => s.slideId === editingId)?.sortOrder ?? 0,
        isActive: form.isActive,
      };
      const url    = editingId === "new" ? "/admin/api/site/hero" : `/admin/api/site/hero/${editingId}`;
      const method = editingId === "new" ? "POST" : "PATCH";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Failed to save slide.");
      setEditingId(null);
      await load();
    } catch (e: any) {
      setError(e.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this slide?")) return;
    await fetch(`/admin/api/site/hero/${id}`, { method: "DELETE" });
    await load();
  };

  const handleToggleActive = async (slide: HeroSlide) => {
    await fetch(`/admin/api/site/hero/${slide.slideId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...slide, isActive: !slide.isActive }),
    });
    await load();
  };

  const handleMove = async (index: number, dir: -1 | 1) => {
    const newSlides = [...slides];
    const target    = index + dir;
    if (target < 0 || target >= newSlides.length) return;
    [newSlides[index], newSlides[target]] = [newSlides[target], newSlides[index]];
    const reorder = newSlides.map((s, i) => ({ slideId: s.slideId, sortOrder: (i + 1) * 10 }));
    await fetch("/admin/api/site/hero/reorder", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slides: reorder }),
    });
    await load();
  };

  // Step 1: media picked → open crop modal
  const handlePickMedia = (media: SiteMediaItem) => {
    setPickerOpen(false);
    if (!media.readUrl) {
      // No URL to crop — use as-is
      setForm((f) => ({ ...f, mediaId: media.mediaId, media: media }));
      return;
    }
    setCropPending(media);
    setCropSrc(media.readUrl);
    setCropOpen(true);
  };

  // Step 2: crop confirmed → upload cropped version, set on form
  const handleCropConfirm = async (croppedFile: File) => {
    setCropOpen(false);
    if (!cropPending) return;
    setError(null);

    try {
      const createRes = await fetch("/admin/api/site/media", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:          (cropPending.name ?? "slide") + " (cropped)",
          fileName:      croppedFile.name,
          contentType:   "image/jpeg",
          fileSizeBytes: croppedFile.size,
        }),
      });
      if (!createRes.ok) throw new Error("Failed to save cropped image.");
      const { mediaId: newMediaId, uploadUrl } = await createRes.json();

      await fetch(uploadUrl, {
        method:  "PUT",
        headers: { "x-ms-blob-type": "BlockBlob", "Content-Type": "image/jpeg" },
        body:    croppedFile,
      });

      // Use a local blob URL for instant preview — will be replaced by SAS on next load
      const previewUrl = URL.createObjectURL(croppedFile);
      setForm((f) => ({
        ...f,
        mediaId: newMediaId,
        media:   { ...cropPending, mediaId: newMediaId, readUrl: previewUrl },
      }));
    } catch (e: any) {
      setError(e.message ?? "Failed to save cropped image.");
    } finally {
      setCropPending(null);
      setCropSrc(null);
    }
  };

  const handleCropCancel = () => {
    setCropOpen(false);
    setCropSrc(null);
    setCropPending(null);
  };

  return (
    <div className="p-8" style={{ background: "#111", color: "rgba(255,255,255,0.85)" }}>
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="ll-label mb-2 text-[0.6rem] font-medium uppercase tracking-[0.25em]" style={{ color: "rgba(255,255,255,0.3)" }}>
              Admin · Site
            </div>
            <h1 className="ll-display font-normal" style={{ fontSize: "2rem", color: "rgba(255,255,255,0.9)" }}>
              Hero Banner
            </h1>
            <p className="ll-body mt-1 text-sm font-light" style={{ color: "rgba(255,255,255,0.35)" }}>
              Manage the rotating slides. Photos are cropped to 21:9 when added.
            </p>
          </div>
          {editingId === null && (
            <button
              onClick={openNew}
              className="ll-label px-5 py-2.5 text-[0.65rem] font-medium uppercase tracking-[0.15em] transition-all hover:-translate-y-px"
              style={{ background: "var(--rose-deep, #b07878)", color: "#fff", border: "none", cursor: "pointer" }}
            >
              + Add Slide
            </button>
          )}
        </div>

        {/* Edit / New form */}
        {editingId !== null && (
          <div className="mb-8 p-6" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="ll-label mb-5 text-[0.62rem] font-medium uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.35)" }}>
              {editingId === "new" ? "New Slide" : "Edit Slide"}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {/* Photo picker */}
              <div className="sm:col-span-2">
                <label className="ll-label mb-2 block text-[0.6rem] uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Photo <span style={{ color: "rgba(255,255,255,0.2)", textTransform: "none", letterSpacing: 0 }}>— will be cropped to 21:9</span>
                </label>
                <div className="flex items-center gap-4">
                  {/* Preview at 21:9 */}
                  <div
                    className="shrink-0 overflow-hidden"
                    style={{ width: 168, height: 72, background: "#242424", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {form.media?.readUrl
                      ? <img src={form.media.readUrl} alt="" className="h-full w-full object-cover" />
                      : <div className="flex h-full w-full items-center justify-center text-xl opacity-20">🖼</div>
                    }
                  </div>
                  <button
                    onClick={() => setPickerOpen(true)}
                    className="ll-label px-4 py-2 text-[0.62rem] uppercase tracking-[0.15em] transition-colors"
                    style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)", background: "none", cursor: "pointer" }}
                  >
                    {form.media ? "Change photo" : "Pick photo"}
                  </button>
                  {form.media && (
                    <button
                      onClick={() => setForm((f) => ({ ...f, mediaId: null, media: null }))}
                      className="ll-label text-[0.62rem] uppercase tracking-[0.1em] opacity-50 hover:opacity-100"
                      style={{ color: "#e07070", background: "none", border: "none", cursor: "pointer" }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Heading */}
              <div>
                <label className="ll-label mb-2 block text-[0.6rem] uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.4)" }}>Heading</label>
                <input type="text" value={form.heading} onChange={(e) => setForm((f) => ({ ...f, heading: e.target.value }))}
                  placeholder="Thirty Years of Sunday Mornings"
                  className="ll-body w-full bg-transparent px-3 py-2 text-sm outline-none placeholder:italic"
                  style={{ color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.1)", caretColor: "var(--rose-light)" }} />
              </div>

              {/* Subtext */}
              <div>
                <label className="ll-label mb-2 block text-[0.6rem] uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.4)" }}>Subtext</label>
                <input type="text" value={form.subtext} onChange={(e) => setForm((f) => ({ ...f, subtext: e.target.value }))}
                  placeholder="Antique linens, handpicked since 1994"
                  className="ll-body w-full bg-transparent px-3 py-2 text-sm outline-none placeholder:italic"
                  style={{ color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.1)", caretColor: "var(--rose-light)" }} />
              </div>

              {/* Link URL */}
              <div>
                <label className="ll-label mb-2 block text-[0.6rem] uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.4)" }}>Link URL</label>
                <input type="text" value={form.linkUrl} onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                  placeholder="/shop"
                  className="ll-body w-full bg-transparent px-3 py-2 text-sm outline-none placeholder:italic"
                  style={{ color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.1)", caretColor: "var(--rose-light)" }} />
              </div>

              {/* Link label */}
              <div>
                <label className="ll-label mb-2 block text-[0.6rem] uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.4)" }}>Link Label</label>
                <input type="text" value={form.linkLabel} onChange={(e) => setForm((f) => ({ ...f, linkLabel: e.target.value }))}
                  placeholder="Browse the Collection"
                  className="ll-body w-full bg-transparent px-3 py-2 text-sm outline-none placeholder:italic"
                  style={{ color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.1)", caretColor: "var(--rose-light)" }} />
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3">
                <input type="checkbox" id="isActive" checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="h-4 w-4 accent-rose-400" />
                <label htmlFor="isActive" className="ll-label text-[0.62rem] uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Active (visible on site)
                </label>
              </div>
            </div>

            {error && (
              <div className="mt-4 ll-label text-[0.62rem] uppercase tracking-[0.1em]" style={{ color: "#e07070" }}>{error}</div>
            )}

            <div className="mt-6 flex gap-3">
              <button onClick={handleSave} disabled={saving}
                className="ll-label px-6 py-2.5 text-[0.65rem] font-medium uppercase tracking-[0.15em] transition-all disabled:opacity-40"
                style={{ background: "var(--rose-deep, #b07878)", color: "#fff", border: "none", cursor: "pointer" }}>
                {saving ? "Saving…" : "Save Slide"}
              </button>
              <button onClick={cancelEdit}
                className="ll-label px-6 py-2.5 text-[0.65rem] font-medium uppercase tracking-[0.15em] transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)", background: "none", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Slides list */}
        {loading ? (
          <div className="ll-label py-20 text-center text-[0.65rem] uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.2)" }}>Loading…</div>
        ) : slides.length === 0 ? (
          <div className="ll-label py-20 text-center text-[0.65rem] uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.2)" }}>No slides yet — add one above.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {slides.map((slide, index) => (
              <div key={slide.slideId} className="flex items-center gap-4 p-4"
                style={{ background: "#1a1a1a", border: `1px solid ${slide.isActive ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)"}`, opacity: slide.isActive ? 1 : 0.5 }}>

                {/* Thumbnail at 21:9 */}
                <div className="shrink-0 overflow-hidden" style={{ width: 126, height: 54, background: "#242424" }}>
                  {slide.media?.readUrl
                    ? <img src={slide.media.readUrl} alt="" className="h-full w-full object-cover" />
                    : <div className="flex h-full w-full items-center justify-center text-xl opacity-20">🖼</div>
                  }
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="ll-display text-sm font-normal" style={{ color: "rgba(255,255,255,0.8)" }}>
                    {slide.heading || <span style={{ color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>No heading</span>}
                  </div>
                  {slide.subtext && (
                    <div className="ll-body text-xs font-light truncate mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{slide.subtext}</div>
                  )}
                  {slide.linkUrl && (
                    <div className="ll-label text-[0.58rem] uppercase tracking-[0.1em] mt-1" style={{ color: "rgba(176,120,120,0.7)" }}>→ {slide.linkUrl}</div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handleMove(index, -1)} disabled={index === 0}
                    className="ll-label flex h-7 w-7 items-center justify-center text-sm transition-opacity disabled:opacity-20"
                    style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", background: "none", cursor: "pointer" }}>↑</button>
                  <button onClick={() => handleMove(index, 1)} disabled={index === slides.length - 1}
                    className="ll-label flex h-7 w-7 items-center justify-center text-sm transition-opacity disabled:opacity-20"
                    style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", background: "none", cursor: "pointer" }}>↓</button>
                  <button onClick={() => handleToggleActive(slide)}
                    className="ll-label px-3 py-1 text-[0.58rem] uppercase tracking-[0.1em] transition-colors"
                    style={{ border: "1px solid rgba(255,255,255,0.1)", color: slide.isActive ? "rgba(144,196,144,0.8)" : "rgba(255,255,255,0.3)", background: "none", cursor: "pointer" }}>
                    {slide.isActive ? "Live" : "Hidden"}
                  </button>
                  <button onClick={() => openEdit(slide)}
                    className="ll-label px-3 py-1 text-[0.58rem] uppercase tracking-[0.1em] transition-colors hover:bg-white/5"
                    style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", background: "none", cursor: "pointer" }}>Edit</button>
                  <button onClick={() => handleDelete(slide.slideId)}
                    className="ll-label px-3 py-1 text-[0.58rem] uppercase tracking-[0.1em] transition-colors hover:bg-red-900/20"
                    style={{ border: "1px solid rgba(200,100,100,0.2)", color: "rgba(200,100,100,0.6)", background: "none", cursor: "pointer" }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Media picker */}
      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePickMedia}
        title="Pick slide photo"
      />

      {/* 21:9 crop — opens automatically after picking a photo */}
      <CropModal
        open={cropOpen}
        src={cropSrc}
        fileName={(cropPending?.name ?? "slide") + ".jpg"}
        onConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
      />
    </div>
  );
}