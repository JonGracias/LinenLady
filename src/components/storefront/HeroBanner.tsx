// src/components/storefront/HeroBanner.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { InventoryItem } from "@/types/inventory";

/**
 * Panel anchor positions — kept as a union so the AI backend can save one of
 * these strings to the DB and pass it straight through as `panelPosition`.
 *
 * Current (client-side) default: "bottom"
 * Future: AI analyses the uploaded image, finds the least-busy region, and
 *         returns one of these values to store in site.HeroSlide.PanelPosition.
 */
export type PanelPosition =
  | "bottom"        // full-width caption bar along the bottom edge (default)
  | "bottom-left"   // compact card, bottom-left corner
  | "bottom-right"  // compact card, bottom-right corner
  | "top-left"      // compact card, top-left corner
  | "top-right";    // compact card, top-right corner

export type BannerSlide = {
  photoUrl?:       string;
  label?:          string;
  headline:        string;
  sub?:            string;
  href?:           string;
  cta?:            string;
  secondaryHref?:  string;
  secondaryCta?:   string;
  thumbnailUrl?:   string | null;
  itemName?:       string;
  /** Saved by AI on upload. Falls back to "bottom" if omitted. */
  panelPosition?:  PanelPosition;
};

type Props = {
  slides:    BannerSlide[];
  interval?: number;
};

/* ─────────────────────────────────────────────────────────────────────────────
   Position helpers
   Returns Tailwind / inline-style classes for each anchor value.
───────────────────────────────────────────────────────────────────────────── */
function getPanelStyles(pos: PanelPosition): {
  wrapperClass: string;
  cardClass:    string;
  fullWidth:    boolean;
} {
  switch (pos) {
    case "bottom":
      return {
        wrapperClass: "absolute bottom-0 left-0 right-0 z-10",
        cardClass:    "w-full",
        fullWidth:    true,
      };
    case "bottom-left":
      return {
        wrapperClass: "absolute bottom-6 left-6 z-10",
        cardClass:    "max-w-xs",
        fullWidth:    false,
      };
    case "bottom-right":
      return {
        wrapperClass: "absolute bottom-6 right-6 z-10",
        cardClass:    "max-w-xs",
        fullWidth:    false,
      };
    case "top-left":
      return {
        wrapperClass: "absolute top-6 left-6 z-10",
        cardClass:    "max-w-xs",
        fullWidth:    false,
      };
    case "top-right":
      return {
        wrapperClass: "absolute top-6 right-6 z-10",
        cardClass:    "max-w-xs",
        fullWidth:    false,
      };
  }
}

export default function HeroBanner({ slides, interval = 6000 }: Props) {
  const [current, setCurrent]             = useState(0);
  const [prev, setPrev]                   = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [paused, setPaused]               = useState(false);
  const timerRef                          = useRef<ReturnType<typeof setTimeout> | null>(null);
  const count = slides.length;

  /* ── Measure header height → --chrome-height ── */
  useEffect(() => {
    function measure() {
      const header = document.getElementById("site-header");
      const offset = header?.offsetHeight ?? 0;
      document.documentElement.style.setProperty("--chrome-height", `${offset}px`);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  function goTo(index: number) {
    if (transitioning || index === current) return;
    setPrev(current);
    setTransitioning(true);
    setCurrent(index);
    setTimeout(() => { setPrev(null); setTransitioning(false); }, 700);
  }
  const next  = () => goTo((current + 1) % count);
  const prev_ = () => goTo((current - 1 + count) % count);

  useEffect(() => {
    if (paused || count <= 1) return;
    timerRef.current = setTimeout(next, interval);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, paused, count, interval]);

  if (!slides.length) {
    return (
      <div
        className="w-full ll-texture-overlay"
        style={{ height: "35vh", background: "var(--surface-container-low)" }}
      />
    );
  }

  const slide    = slides[current];
  const bgImage  = slide.photoUrl ?? slide.thumbnailUrl ?? null;
  const position = slide.panelPosition ?? "bottom";
  const { wrapperClass, cardClass, fullWidth } = getPanelStyles(position);

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: "35vh", background: "var(--surface-container)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Slides ── */}
      {slides.map((s, i) => {
        const img      = s.photoUrl ?? s.thumbnailUrl ?? null;
        const isActive = i === current;
        const isPrev   = i === prev;
        return (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: isActive ? 1 : isPrev ? 0 : 0, zIndex: isActive ? 2 : isPrev ? 1 : 0 }}
          >
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={img}
                alt={s.itemName ?? s.headline}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div
                className="absolute inset-0 ll-embroidery-bg"
                style={{
                  background: [
                    "linear-gradient(135deg, var(--surface-container-low) 0%, var(--surface-container) 50%, var(--surface-container-high) 100%)",
                    "linear-gradient(135deg, var(--primary-container) 0%, var(--surface-container-low) 60%, var(--surface-container) 100%)",
                    "linear-gradient(135deg, var(--surface-container) 0%, var(--surface-container-low) 40%, var(--primary-container) 100%)",
                  ][i % 3],
                }}
              />
            )}
          </div>
        );
      })}

      {/* ── Info panel — position driven by panelPosition prop ── */}
      <div className={wrapperClass} style={{ zIndex: 10 }}>
        {fullWidth ? (
          /* ── FULL-WIDTH bottom caption bar ── */
          <div
            className={`${cardClass} flex items-center justify-between gap-6 px-6 md:px-10 py-3`}
            style={{
              background:     "rgba(30,27,26,0.62)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderTop:      "1px solid rgba(196,181,168,0.18)",
            }}
          >
            {/* Left: label + headline + sub */}
            <div className="flex items-baseline gap-4 min-w-0 flex-1">
              {slide.label && (
                <span
                  className="ll-label hidden md:inline-block shrink-0 text-[0.58rem] font-medium uppercase tracking-[0.2em]"
                  style={{ color: "var(--primary)" }}
                >
                  {slide.label}
                </span>
              )}
              <span
                className="ll-display font-normal truncate"
                style={{
                  fontSize:      "clamp(0.95rem, 1.6vw, 1.35rem)",
                  color:         "rgba(253,250,246,0.95)",
                  letterSpacing: "-0.01em",
                }}
              >
                {slide.headline}
              </span>
              {slide.sub && (
                <span
                  className="ll-body hidden lg:inline font-light truncate text-sm"
                  style={{ color: "rgba(253,250,246,0.6)" }}
                >
                  {slide.sub}
                </span>
              )}
            </div>

            {/* Right: CTAs */}
            <div className="flex shrink-0 items-center gap-3">
              {slide.href && slide.cta && (
                <Link
                  href={slide.href}
                  className="ll-label whitespace-nowrap px-5 py-2 text-[0.62rem] font-medium uppercase tracking-[0.12em] transition-all duration-300"
                  style={{
                    background:   "var(--primary)",
                    color:        "var(--on-primary)",
                    borderRadius: "0.25rem",
                  }}
                >
                  {slide.cta}
                </Link>
              )}
              {slide.secondaryHref && slide.secondaryCta && (
                <Link
                  href={slide.secondaryHref}
                  className="ll-label hidden md:inline-block whitespace-nowrap px-4 py-2 text-[0.62rem] font-medium uppercase tracking-[0.12em] transition-all duration-300"
                  style={{
                    background:   "transparent",
                    color:        "rgba(253,250,246,0.75)",
                    border:       "1px solid rgba(196,181,168,0.3)",
                    borderRadius: "0.25rem",
                  }}
                >
                  {slide.secondaryCta}
                </Link>
              )}
            </div>
          </div>
        ) : (
          /* ── COMPACT CARD for corner positions ── */
          <div
            className={`${cardClass} p-5`}
            style={{
              background:           "rgba(30,27,26,0.62)",
              backdropFilter:       "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderRadius:         "0.375rem",
              outline:              "1px solid rgba(196,181,168,0.22)",
            }}
          >
            {slide.label && (
              <p className="ll-label mb-2 text-[0.58rem] font-medium uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>
                {slide.label}
              </p>
            )}
            <p
              className="ll-display font-normal leading-tight mb-1"
              style={{ fontSize: "clamp(0.9rem,1.4vw,1.2rem)", color: "rgba(253,250,246,0.95)", letterSpacing: "-0.01em" }}
            >
              {slide.headline}
            </p>
            {slide.sub && (
              <p className="ll-body text-xs font-light mb-3" style={{ color: "rgba(253,250,246,0.6)" }}>
                {slide.sub}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {slide.href && slide.cta && (
                <Link
                  href={slide.href}
                  className="ll-label px-4 py-1.5 text-[0.6rem] font-medium uppercase tracking-[0.1em]"
                  style={{ background: "var(--primary)", color: "var(--on-primary)", borderRadius: "0.25rem" }}
                >
                  {slide.cta}
                </Link>
              )}
              {slide.secondaryHref && slide.secondaryCta && (
                <Link
                  href={slide.secondaryHref}
                  className="ll-label px-4 py-1.5 text-[0.6rem] font-medium uppercase tracking-[0.1em]"
                  style={{ border: "1px solid rgba(196,181,168,0.3)", color: "rgba(253,250,246,0.75)", borderRadius: "0.25rem" }}
                >
                  {slide.secondaryCta}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Nav arrows ── */}
      {count > 1 && (
        <>
          <button
            onClick={prev_}
            className="absolute left-3 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center transition-all duration-300 hover:scale-105"
            style={{
              background:   "rgba(30,27,26,0.45)",
              backdropFilter: "blur(6px)",
              color:        "rgba(253,250,246,0.85)",
              borderRadius: "0.25rem",
              border:       "1px solid rgba(196,181,168,0.2)",
            }}
            aria-label="Previous slide"
          >←</button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center transition-all duration-300 hover:scale-105"
            style={{
              background:   "rgba(30,27,26,0.45)",
              backdropFilter: "blur(6px)",
              color:        "rgba(253,250,246,0.85)",
              borderRadius: "0.25rem",
              border:       "1px solid rgba(196,181,168,0.2)",
            }}
            aria-label="Next slide"
          >→</button>
        </>
      )}

      {/* ── Slide counter (top-right) ── */}
      <div
        className="ll-label absolute right-4 top-3 z-20 text-[0.56rem] font-medium uppercase tracking-[0.2em]"
        style={{ color: bgImage ? "rgba(255,255,255,0.5)" : "var(--on-surface-variant)" }}
      >
        {String(current + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
      </div>

      {/* ── Dots (bottom-right, above caption bar) ── */}
      {count > 1 && (
        <div className="absolute bottom-14 right-5 z-20 flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
              style={{
                width:        i === current ? 18 : 5,
                height:       5,
                borderRadius: 3,
                background:   i === current ? "var(--primary)" : "rgba(253,250,246,0.35)",
                border:       "none",
                cursor:       "pointer",
                padding:      0,
                transition:   "all 400ms ease",
              }}
            />
          ))}
        </div>
      )}

      {/* ── Progress bar ── */}
      {count > 1 && !paused && (
        <div className="absolute bottom-0 left-0 z-30 h-[2px] w-full" style={{ background: "transparent" }}>
          <div
            key={current}
            className="h-full origin-left"
            style={{ background: "var(--primary)", animation: `ll-progress ${interval}ms linear forwards` }}
          />
        </div>
      )}
    </div>
  );
}

export function buildSlidesFromItems(
  items: InventoryItem[],
  getThumbnail: (id: number) => string | null
): BannerSlide[] {
  const slides: BannerSlide[] = items.slice(0, 5).map((item) => ({
    thumbnailUrl:  getThumbnail(item.inventoryId),
    itemName:      item.name,
    label:         "Featured Piece",
    headline:      item.name,
    sub:           item.description ?? undefined,
    href:          `/shop/${item.sku}`,
    cta:           "View This Piece",
    secondaryHref: "/shop",
    secondaryCta:  "Browse Collection",
    panelPosition: "bottom", // AI will override this per-slide in future
  }));
  slides.push({
    label:         "Georgetown · Every Sunday",
    headline:      "Curators of Antique & Vintage Linens",
    sub:           "Thirty years at the Georgetown Flea Market. Every piece chosen with care.",
    href:          "/shop",
    cta:           "Explore the Collection",
    secondaryHref: "/#schedule",
    secondaryCta:  "View Archive",
    panelPosition: "bottom",
  });
  return slides;
}