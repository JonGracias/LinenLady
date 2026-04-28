// src/components/shared/MediaPickerModal.tsx
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

export type SiteMediaItem = {
  mediaId:   number;
  name:      string;
  blobPath:  string;
  readUrl:   string | null;
  uploadedAt: string;
};

type Props = {
  open:       boolean;
  onClose:    () => void;
  onSelect:   (media: SiteMediaItem) => void;
  title?:     string;
};

export function MediaPickerModal({ open, onClose, onSelect, title = "Pick a photo" }: Props) {
  const [items,   setItems]   = useState<SiteMediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search,  setSearch]  = useState("");
  const [hovered, setHovered] = useState<number | null>(null);

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

  useEffect(() => {
    if (open) { load(); setSearch(""); }
  }, [open, load]);

  const filtered = items.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative flex flex-col w-full max-w-3xl overflow-hidden"
        style={{
          background: "#1a1a1a",
          border: "1px solid rgba(255,255,255,0.08)",
          maxHeight: "80vh",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <span
            className="ll-label text-[0.7rem] font-medium uppercase tracking-[0.2em]"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            {title}
          </span>
          <button
            onClick={onClose}
            className="ll-label text-lg leading-none transition-opacity hover:opacity-60"
            style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none" }}
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <input
            type="text"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:italic"
            style={{
              color: "rgba(255,255,255,0.7)",
              caretColor: "var(--rose-light)",
              fontFamily: "var(--font-body, serif)",
            }}
            autoFocus
          />
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div
              className="ll-label py-16 text-center text-[0.65rem] uppercase tracking-[0.2em]"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="ll-label py-16 text-center text-[0.65rem] uppercase tracking-[0.2em]"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              {search ? "No photos match your search" : "No photos uploaded yet"}
            </div>
          ) : (
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}
            >
              {filtered.map((item) => (
                <button
                  key={item.mediaId}
                  onClick={() => onSelect(item)}
                  onMouseEnter={() => setHovered(item.mediaId)}
                  onMouseLeave={() => setHovered(null)}
                  className="group relative overflow-hidden transition-all duration-200"
                  style={{
                    background: "#242424",
                    border: hovered === item.mediaId
                      ? "1px solid rgba(176,120,120,0.6)"
                      : "1px solid rgba(255,255,255,0.06)",
                    transform: hovered === item.mediaId ? "translateY(-2px)" : "none",
                  }}
                >
                  {/* Thumbnail */}
                  <div className="aspect-square overflow-hidden" style={{ background: "#2e2e2e" }}>
                    {item.readUrl ? (
                      <img
                        src={item.readUrl}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl opacity-20">🖼</div>
                    )}
                  </div>
                  {/* Name */}
                  <div
                    className="px-3 py-2 text-left"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    <div
                      className="ll-label text-[0.6rem] uppercase tracking-[0.1em] truncate"
                      style={{ color: "rgba(255,255,255,0.6)" }}
                    >
                      {item.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}