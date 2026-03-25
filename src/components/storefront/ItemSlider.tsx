// /components/storefront/ItemSlider.tsx

"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import FeaturedItemCard from "@/components/storefront/FeaturedItemCard";
import type { InventoryItem } from "@/types/inventory";

type Props = {
  items: InventoryItem[];
  getThumbnailUrl: (id: number) => string | null;
  label?: string;
  title?: React.ReactNode;
  browseHref?: string;
  browseLabel?: string;
};

export default function ItemSlider({
  items,
  getThumbnailUrl,
  label,
  title,
  browseHref = "/shop",
  browseLabel = "Browse All Items",
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [scrollLocked, setScrollLocked] = useState(true);

  // ── Detect mobile ──────────────────────────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // ── Mobile: snap scroll → track active index ──────────────────────────────
  const handleMobileScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const cardWidth = track.clientWidth;
    const newIndex = Math.round(track.scrollLeft / cardWidth);
    setActiveIndex(newIndex);

    // Unlock page scroll once user has passed all items (reached "browse all")
    const maxIndex = items.length; // items.length = the "browse all" card
    setScrollLocked(newIndex < maxIndex);
  }, [items.length]);

  // ── Mobile: lock/unlock page scroll ───────────────────────────────────────
  useEffect(() => {
    if (!isMobile) return;

    const section = sectionRef.current;
    if (!section) return;

    const onWheel = (e: WheelEvent) => {
      if (!scrollLocked) return;
      e.preventDefault();
      const track = trackRef.current;
      if (track) track.scrollLeft += e.deltaY;
    };

    section.addEventListener("wheel", onWheel, { passive: false });
    return () => section.removeEventListener("wheel", onWheel);
  }, [isMobile, scrollLocked]);

  // ── Mobile: programmatic snap to index ────────────────────────────────────
  const snapTo = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
    setActiveIndex(index);
  };

  return (
    <section ref={sectionRef} className="relative z-[1] py-15" style={{ background: "var(--cream-dark)" }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-10 px-6 md:px-16 flex flex-wrap items-end justify-between gap-4">
        <div>
          {label && (
            <div
              className="ll-label mb-3 flex items-center gap-3 text-[0.62rem] font-medium uppercase tracking-[0.25em]"
              style={{ color: "var(--sage-deep)" }}
            >
              <span className="inline-block h-px w-8 shrink-0" style={{ background: "var(--sage-deep)" }} />
              {label}
            </div>
          )}
          {title && (
            <h2
              className="ll-display font-normal leading-snug"
              style={{ fontSize: "clamp(1.8rem,3vw,2.8rem)", color: "var(--ink)" }}
            >
              {title}
            </h2>
          )}
        </div>

        {/* Desktop browse link */}
        <Link
          href={browseHref}
          className="ll-label hidden md:inline-flex items-center gap-2 group relative border-2 px-10 py-4 text-[0.72rem] font-medium uppercase tracking-[0.2em] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(176,120,120,0.25)]"
          style={{ borderColor: "var(--rose-deep)", color: "var(--rose-deep)", background: "transparent" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--rose-deep)"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--rose-deep)"; }}
        >
          <span>{browseLabel}</span>
          <span className="text-base leading-none">→</span>
        </Link>
      </div>

      {/* ── Mobile: full-width snap scroll ────────────────────────────────── */}
      <div className="md:hidden">
        <div
          ref={trackRef}
          onScroll={handleMobileScroll}
          className="flex overflow-x-auto snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
        >
          {items.map((item) => (
            <div
              key={item.InventoryId}
              className="w-full shrink-0 snap-center px-6"
            >
              <FeaturedItemCard item={item} thumbnailUrl={getThumbnailUrl(item.InventoryId)} />
            </div>
          ))}

          {/* Browse All — final snap card */}
          <div className="w-full shrink-0 snap-center px-6 flex items-center justify-center py-16">
            <Link
              href={browseHref}
              className="ll-label inline-flex items-center gap-4 border-2 px-12 py-5 text-[0.8rem] font-medium uppercase tracking-[0.2em] transition-all duration-300"
              style={{ borderColor: "var(--rose-deep)", color: "var(--rose-deep)", background: "transparent" }}
            >
              <span>{browseLabel}</span>
              <span className="text-lg leading-none">→</span>
            </Link>
          </div>
        </div>

        {/* Dot indicators */}
        <div className="mt-5 flex items-center justify-center gap-2">
          {[...items, null].map((_, i) => (
            <button
              key={i}
              onClick={() => snapTo(i)}
              className="transition-all duration-200"
              style={{
                width: activeIndex === i ? "1.5rem" : "0.4rem",
                height: "0.4rem",
                borderRadius: "9999px",
                background: activeIndex === i ? "var(--rose-deep)" : "var(--linen)",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
              aria-label={i < items.length ? `Go to item ${i + 1}` : "Browse all"}
            />
          ))}
        </div>
      </div>

      {/* ── Desktop: horizontal single-row scroll ─────────────────────────── */}
      <div
        className="hidden md:flex gap-6 overflow-x-auto px-16 "
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((item) => (
          <div key={item.InventoryId} className="w-[300px] shrink-0">
            <FeaturedItemCard item={item} thumbnailUrl={getThumbnailUrl(item.InventoryId)} />
          </div>
        ))}
      </div>
    </section>
  );
}