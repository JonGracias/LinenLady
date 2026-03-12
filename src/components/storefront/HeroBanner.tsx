"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { InventoryItem } from "@/types/inventory";

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */

export type BannerSlide = {
  /** If provided, renders a real photo instead of inventory thumbnail */
  photoUrl?: string;
  /** Label shown on the slide, e.g. "Just Arrived" or "French Linens" */
  label?: string;
  /** Headline copy */
  headline: string;
  /** Sub-copy */
  sub?: string;
  /** CTA link */
  href?: string;
  /** CTA label */
  cta?: string;
  // Inventory-derived fields (auto-filled when built from items)
  thumbnailUrl?: string | null;
  itemName?: string;
};

type Props = {
  slides: BannerSlide[];
  /** Auto-advance interval in ms. Default 5000. */
  interval?: number;
};

/* ─────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────── */

export default function HeroBanner({ slides, interval = 5000 }: Props) {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [paused, setPaused] = useState(false);

  const count = slides.length;

  function goTo(index: number) {
    if (transitioning || index === current) return;
    setPrev(current);
    setTransitioning(true);
    setCurrent(index);
    setTimeout(() => {
      setPrev(null);
      setTransitioning(false);
    }, 700);
  }

  function next() {
    goTo((current + 1) % count);
  }

  function prev_() {
    goTo((current - 1 + count) % count);
  }

  // Auto-advance
  useEffect(() => {
    if (paused || count <= 1) return;
    timerRef.current = setTimeout(next, interval);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, paused, count, interval]);

  if (!slides.length) return null;

  const slide = slides[current];
  const bgImage = slide.photoUrl ?? slide.thumbnailUrl ?? null;

  return (
    <div
      className="relative overflow-hidden"
      style={{ height: "35vh", minHeight: 210, background: "var(--linen)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Slides ── */}
      {slides.map((s, i) => {
        const img = s.photoUrl ?? s.thumbnailUrl ?? null;
        const isActive = i === current;
        const isPrev   = i === prev;

        return (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-700"
            style={{
              opacity: isActive ? 1 : isPrev ? 0 : 0,
              zIndex:  isActive ? 2 : isPrev ? 1 : 0,
            }}
          >
            {/* Background image or gradient */}
            {img ? (
              <>
                <img
                  src={img}
                  alt={s.itemName ?? s.headline}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {/* Scrim */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(105deg, rgba(44,31,26,0.72) 0%, rgba(44,31,26,0.35) 55%, rgba(44,31,26,0.10) 100%)",
                  }}
                />
              </>
            ) : (
              /* Placeholder gradient when no image yet */
              <div
                className="absolute inset-0"
                style={{
                  background: [
                    "linear-gradient(135deg, var(--rose-light) 0%, var(--linen) 40%, var(--sage-light) 100%)",
                    "linear-gradient(135deg, var(--sage-light) 0%, var(--cream-dark) 50%, var(--rose-light) 100%)",
                    "linear-gradient(135deg, var(--linen) 0%, var(--cream-dark) 40%, var(--sage-light) 100%)",
                    "linear-gradient(135deg, var(--rose-light) 0%, var(--cream) 50%, var(--linen) 100%)",
                  ][i % 4],
                }}
              >
                {/* Embroidery pattern overlay */}
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Ccircle cx='40' cy='40' r='36' fill='none' stroke='%238fad94' stroke-width='0.8' stroke-dasharray='5 4' opacity='0.5'/%3E%3Ccircle cx='40' cy='40' r='24' fill='none' stroke='%23d4a0a0' stroke-width='0.6' opacity='0.4'/%3E%3Ccircle cx='40' cy='40' r='4' fill='%23d4a0a0' opacity='0.3'/%3E%3C/svg%3E")`,
                    backgroundSize: "80px 80px",
                  }}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* ── Content overlay ── */}
      <div
        className="relative z-10 flex h-full flex-col justify-end pb-8 pl-20 pr-8"
        style={{ maxWidth: 600 }}
      >
        {/* Eyebrow label */}
        {slide.label && (
          <div
            className="ll-label mb-4 inline-flex w-fit items-center gap-2 px-3 py-1 text-[0.6rem] font-500 uppercase tracking-[0.25em]"
            style={{
              background: "var(--rose-deep)",
              color: "#fff",
            }}
          >
            {slide.label}
          </div>
        )}

        {/* Headline */}
        <h1
          className="ll-display mb-2 font-normal leading-[1.05]"
          style={{
            fontSize: "clamp(1.4rem, 2.5vw, 2.4rem)",
            color: bgImage ? "#fff" : "var(--ink)",
            textShadow: bgImage ? "0 2px 20px rgba(44,31,26,0.3)" : "none",
          }}
        >
          {slide.headline}
        </h1>

        {/* Sub */}
        {slide.sub && (
          <p
            className="ll-body mb-5 max-w-md text-sm font-light leading-relaxed"
            style={{
              color: bgImage ? "rgba(255,255,255,0.85)" : "var(--ink-soft)",
            }}
          >
            {slide.sub}
          </p>
        )}

        {/* CTA */}
        {slide.href && slide.cta && (
          <Link
            href={slide.href}
            className="ll-label inline-block w-fit px-8 py-3.5 text-[0.72rem] font-500 uppercase tracking-[0.15em] transition-all duration-200 hover:-translate-y-px"
            style={{
              background: bgImage ? "var(--cream)" : "var(--rose-deep)",
              color: bgImage ? "var(--rose-deep)" : "#fff",
            }}
          >
            {slide.cta}
          </Link>
        )}
      </div>

      {/* ── Nav arrows ── */}
      {count > 1 && (
        <>
          <button
            onClick={prev_}
            className="absolute left-6 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center transition-all duration-200 hover:scale-110"
            style={{
              background: "rgba(250,246,240,0.15)",
              border: "1px solid rgba(250,246,240,0.3)",
              color: "#fff",
              backdropFilter: "blur(4px)",
            }}
            aria-label="Previous slide"
          >
            ←
          </button>
          <button
            onClick={next}
            className="absolute right-6 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center transition-all duration-200 hover:scale-110"
            style={{
              background: "rgba(250,246,240,0.15)",
              border: "1px solid rgba(250,246,240,0.3)",
              color: "#fff",
              backdropFilter: "blur(4px)",
            }}
            aria-label="Next slide"
          >
            →
          </button>
        </>
      )}

      {/* ── Dot indicators ── */}
      {count > 1 && (
        <div className="absolute bottom-7 right-8 z-20 flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className="transition-all duration-300"
              style={{
                width:  i === current ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background:
                  i === current
                    ? "var(--rose-light)"
                    : "rgba(255,255,255,0.35)",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Progress bar ── */}
      {count > 1 && !paused && (
        <div
          className="absolute bottom-0 left-0 z-20 h-0.5"
          style={{ background: "var(--rose-deep)", width: "100%" }}
        >
          <div
            key={current}
            className="h-full origin-left"
            style={{
              background: "var(--rose-light)",
              animation: `ll-progress ${interval}ms linear forwards`,
            }}
          />
        </div>
      )}

      {/* ── Slide counter ── */}
      <div
        className="ll-label absolute right-8 top-8 z-20 text-[0.6rem] font-400 uppercase tracking-[0.2em]"
        style={{ color: "rgba(255,255,255,0.6)" }}
      >
        {String(current + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
      </div>

      {/* ── Decorative bottom border ── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 h-1"
        style={{
          background:
            "linear-gradient(90deg, var(--rose-deep), var(--sage), var(--rose-light))",
        }}
      />

      <style>{`
        @keyframes ll-progress {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Helper — build slides from inventory items
   Pass real photos later by spreading { photoUrl, label } over
   individual slides.
───────────────────────────────────────────────────────────── */

export function buildSlidesFromItems(
  items: InventoryItem[],
  getThumbnail: (id: number) => string | null
): BannerSlide[] {
  // Category groupings for richer slide copy
  const categoryMeta: Record<string, { label: string; headline: string; sub: string }> = {
    tablecloth: {
      label: "Antique Linens",
      headline: "Tablecloths with a History",
      sub: "Damask, embroidered cotton, printed linen — each one a story waiting for a new table.",
    },
    napkin: {
      label: "Table Linens",
      headline: "The Art of Setting a Table",
      sub: "Monogrammed, hand-hemstitched, perfectly pressed. Napkins the way they used to be made.",
    },
    lace: {
      label: "Vintage Lace",
      headline: "Handmade Lace & Fine Embroidery",
      sub: "Rare needle lace, bobbin lace, and broderie anglaise from Europe and beyond.",
    },
    "bed linen": {
      label: "Bed Linens",
      headline: "Sleep the Old-Fashioned Way",
      sub: "Fine cotton and linen sheets, pillow shams, and coverlets from another era.",
    },
  };

  const slides: BannerSlide[] = items.slice(0, 6).map((item) => {
    const cat = (item as any).Category as string | undefined;
    const meta = cat ? categoryMeta[cat] : undefined;
    const thumb = getThumbnail(item.InventoryId);

    return {
      thumbnailUrl: thumb,
      itemName:     item.Name,
      label:        meta?.label ?? "Featured Piece",
      headline:     meta?.headline ?? item.Name,
      sub:          meta?.sub ?? item.Description ?? undefined,
      href:         `/shop/${item.PublicId}`,
      cta:          "View this piece",
    };
  });

  // Always add a "visit us" slide at the end
  slides.push({
    label:    "Georgetown · Sundays",
    headline: "Find Us at the Market",
    sub:      "Booth open every Sunday, 8am–4pm, rain or shine. Thirty years in the same spot.",
    href:     "#schedule",
    cta:      "Get directions",
  });

  return slides;
}