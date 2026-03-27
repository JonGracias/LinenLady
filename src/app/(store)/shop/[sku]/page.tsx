// src/app/(store)/shop/[sku]/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { InventoryItem, InventoryImage } from "@/types/inventory";
import { useStorefrontContext } from "@/context/StorefrontContext";
import { useCart } from "@/context/CartContext";

/* ─── helpers ─────────────────────────────────────────────────────────────── */

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

/* ─── types ───────────────────────────────────────────────────────────────── */

type ItemDetail = InventoryItem & {
  images?: InventoryImage[];
};

/* ─── Breadcrumb ──────────────────────────────────────────────────────────── */

function Breadcrumb({ name }: { name: string }) {
  return (
    <nav className="flex items-center gap-2 px-6 md:px-10 py-4" aria-label="breadcrumb">
      <Link
        href="/"
        className="ll-label text-[0.58rem] uppercase tracking-[0.15em] transition-opacity hover:opacity-60"
        style={{ color: "var(--on-surface-variant)" }}
      >
        Home
      </Link>
      <span className="ll-label text-[0.58rem]" style={{ color: "var(--outline-variant)" }}>
        /
      </span>
      <Link
        href="/shop"
        className="ll-label text-[0.58rem] uppercase tracking-[0.15em] transition-opacity hover:opacity-60"
        style={{ color: "var(--on-surface-variant)" }}
      >
        Collection
      </Link>
      <span className="ll-label text-[0.58rem]" style={{ color: "var(--outline-variant)" }}>
        /
      </span>
      <span
        className="ll-label text-[0.58rem] uppercase tracking-[0.15em] truncate max-w-[160px]"
        style={{ color: "var(--on-surface)" }}
      >
        {name}
      </span>
    </nav>
  );
}

/* ─── Image Gallery (desktop) ─────────────────────────────────────────────── */

function DesktopGallery({ images }: { images: InventoryImage[] }) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div
        className="flex items-center justify-center ll-display text-2xl italic"
        style={{
          aspectRatio: "4/5",
          background: "var(--surface-container-highest)",
          borderRadius: "0.25rem",
          color: "var(--outline-variant)",
        }}
      >
        Linen Lady
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: "4/5", borderRadius: "0.25rem", background: "var(--surface-container-highest)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[active]?.ReadUrl ?? ""}
          alt={`Detail view ${active + 1}`}
          className="h-full w-full object-cover transition-opacity duration-500"
        />
        {/* One of a Kind badge */}
        <div className="absolute left-0 top-5">
          <span
            className="ll-label px-3 py-1.5 text-[0.52rem] font-medium uppercase tracking-[0.15em]"
            style={{
              background: "rgba(30,27,26,0.68)",
              backdropFilter: "blur(6px)",
              color: "rgba(253,250,246,0.9)",
            }}
          >
            One of a Kind
          </span>
        </div>
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.ImageId}
              onClick={() => setActive(i)}
              className="shrink-0 overflow-hidden transition-all duration-300"
              style={{
                width: 72,
                height: 72,
                borderRadius: "0.2rem",
                outline: i === active
                  ? "2px solid var(--primary)"
                  : "1px solid rgba(196,181,168,0.25)",
                outlineOffset: i === active ? "2px" : "0",
                opacity: i === active ? 1 : 0.65,
              }}
              aria-label={`View image ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.ReadUrl ?? ""}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Mobile Carousel ─────────────────────────────────────────────────────── */

function MobileCarousel({ images }: { images: InventoryImage[] }) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div
        className="w-full flex items-center justify-center ll-display text-2xl italic"
        style={{ aspectRatio: "4/3", background: "var(--surface-container-highest)", color: "var(--outline-variant)" }}
      >
        Linen Lady
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden w-full" style={{ aspectRatio: "4/3" }}>
      {images.map((img, i) => (
        <div
          key={img.ImageId}
          className="absolute inset-0 transition-opacity duration-500"
          style={{ opacity: i === active ? 1 : 0, zIndex: i === active ? 1 : 0 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.ReadUrl ?? ""} alt="" className="h-full w-full object-cover" />
        </div>
      ))}

      {/* Dots */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Image ${i + 1}`}
              style={{
                width: i === active ? 18 : 6,
                height: 6,
                borderRadius: 3,
                background: i === active ? "var(--on-primary)" : "rgba(253,250,246,0.45)",
                border: "none",
                padding: 0,
                cursor: "pointer",
                transition: "all 400ms ease",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Reserve modal (email link) ─────────────────────────────────────────── */

function ReserveModal({
  open,
  onClose,
  item,
}: {
  open: boolean;
  onClose: () => void;
  item: ItemDetail;
}) {
  if (!open) return null;
  const subject = encodeURIComponent(`Reservation Inquiry — ${item.Name} (${item.Sku})`);
  const body = encodeURIComponent(
    `Hello,\n\nI am interested in reserving the following piece:\n\nItem: ${item.Name}\nSKU: ${item.Sku}\nPrice: ${formatPrice(item.UnitPriceCents)}\n\nPlease let me know about availability.\n\nThank you.`
  );
  const mailto = `mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}?subject=${subject}&body=${body}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: "rgba(30,27,26,0.5)", backdropFilter: "blur(4px)" }} />

      {/* Modal */}
      <div
        className="relative w-full md:max-w-md mx-4 md:mx-auto p-8 md:p-10"
        style={{
          background: "var(--surface-bright)",
          borderRadius: "0.5rem 0.5rem 0 0",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="ll-label mb-1 text-[0.58rem] uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>
          Reserve This Piece
        </p>
        <h3 className="ll-display text-xl font-normal mb-2" style={{ color: "var(--on-surface)" }}>
          {item.Name}
        </h3>
        <p className="ll-body text-sm font-light mb-6" style={{ color: "var(--on-surface-variant)" }}>
          Every piece is one of a kind. Sending this inquiry will open your email client with the details pre-filled — Noemi will respond within 24 hours to confirm availability and arrange next steps.
        </p>
        <div className="flex flex-col gap-3">
          <a
            href={mailto}
            className="btn-primary text-center text-[0.65rem] py-3.5"
            style={{ display: "block" }}
          >
            Open Email to Reserve →
          </a>
          <button
            onClick={onClose}
            className="ll-label py-3 text-[0.62rem] uppercase tracking-[0.12em] transition-opacity hover:opacity-60"
            style={{ color: "var(--on-surface-variant)" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Care instructions ───────────────────────────────────────────────────── */

const CARE_STEPS = [
  {
    n: "01",
    title: "Laundering",
    body: "Avoid modern detergents and mechanical washing. Hand wash only in tepid distilled water with a neutral-pH linen soap. Do not wring.",
  },
  {
    n: "02",
    title: "Drying",
    body: "Lay flat on a clean white cotton sheet in a shaded area. Direct sunlight may cause uneven bleaching of the natural fibres.",
  },
  {
    n: "03",
    title: "Storage",
    body: "Roll — never fold — to avoid structural creases. Store in acid-free tissue paper within a breathable cedar chest or linen bag.",
  },
];

/* ─── Main page ───────────────────────────────────────────────────────────── */

export default function ItemDetailPage() {
  const { sku }  = useParams<{ sku: string }>();
  const { getThumbnailUrl, ensureThumbnail } = useStorefrontContext();
  const { add, remove, has } = useCart();

  const [item,    setItem]    = useState<ItemDetail | null>(null);
  const [images,  setImages]  = useState<InventoryImage[]>([]);
  const [related, setRelated] = useState<ItemDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [reserveOpen, setReserveOpen] = useState(false);

  /* ── Fetch item by SKU ── */
  const fetchItem = useCallback(async () => {
    if (!sku) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/items/sku/${sku}`);
      if (res.status === 404) { setError("not_found"); return; }
      if (!res.ok) throw new Error("fetch failed");
      const data: ItemDetail = await res.json();
      setItem(data);

      /* ── Fetch images ── */
      const imgRes = await fetch(`/api/items/${data.InventoryId}/images`);
      if (imgRes.ok) {
        const imgs: InventoryImage[] = await imgRes.json();
        setImages(imgs.sort((a, b) => (b.IsPrimary ? 1 : 0) - (a.IsPrimary ? 1 : 0) || a.SortOrder - b.SortOrder));
      }

      /* ── Fetch related (similar) ── */
      const relRes = await fetch(`/api/items/${data.InventoryId}/similar?top=3`);
      if (relRes.ok) {
        const relData = await relRes.json();
        const rel3 = relData.slice(0, 3) as ItemDetail[];
        setRelated(rel3);
        // Pre-fetch thumbnails for related items via the storefront context cache
        rel3.forEach((r) => ensureThumbnail(r.InventoryId));
      }
    } catch {
      setError("error");
    } finally {
      setLoading(false);
    }
  }, [sku]);

  useEffect(() => { fetchItem(); }, [fetchItem]);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="animate-pulse px-6 md:px-10 py-10 md:grid md:gap-16" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div style={{ aspectRatio: "4/5", background: "var(--surface-container)", borderRadius: "0.25rem" }} />
        <div className="space-y-5 mt-8 md:mt-0">
          <div className="h-3 w-24 rounded-sm" style={{ background: "var(--surface-container-low)" }} />
          <div className="h-8 w-3/4 rounded-sm" style={{ background: "var(--surface-container)" }} />
          <div className="h-5 w-1/4 rounded-sm" style={{ background: "var(--surface-container-low)" }} />
          <div className="space-y-2 pt-4">
            {[1,2,3,4].map(i => <div key={i} className="h-3 rounded-sm" style={{ background: "var(--surface-container-low)", width: `${75 + i * 5}%` }} />)}
          </div>
        </div>
      </div>
    );
  }

  /* ── Not found ── */
  if (error === "not_found" || (!loading && !item)) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
        <p className="ll-display text-3xl italic mb-4" style={{ color: "var(--on-surface-variant)" }}>
          Piece Not Found
        </p>
        <p className="ll-body text-base font-light mb-8" style={{ color: "var(--outline)" }}>
          This item may have been sold or removed from the collection.
        </p>
        <Link href="/shop" className="btn-primary">Browse the Collection →</Link>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
        <p className="ll-display text-2xl italic mb-4" style={{ color: "var(--on-surface-variant)" }}>
          Something went wrong.
        </p>
        <button onClick={fetchItem} className="btn-secondary">Try Again</button>
      </div>
    );
  }

  /* ── Full page ── */
  return (
    <>
      <div
        className="ll-texture-overlay min-h-screen pb-28 md:pb-0"
        style={{ background: "var(--surface)", color: "var(--on-surface)" }}
      >
        <Breadcrumb name={item.Name} />

        {/* ────────────────────────────────────────────────────────
            Desktop: two-column layout — gallery left, info right
        ──────────────────────────────────────────────────────── */}
        <div className="px-6 md:px-10 md:grid md:gap-14 lg:gap-20 pb-0" style={{ gridTemplateColumns: "1fr 1fr" }}>

          {/* ── Left: gallery (desktop only) ── */}
          <div className="hidden md:block">
            <DesktopGallery images={images} />
          </div>

          {/* ── Mobile: carousel ── */}
          <div className="md:hidden -mx-6 mb-6">
            <MobileCarousel images={images} />
          </div>

          {/* ── Right: information panel ── */}
          <div className="flex flex-col">

            {/* Status + SKU */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {item.IsFeatured && (
                  <span
                    className="ll-label px-2.5 py-1 text-[0.5rem] font-medium uppercase tracking-[0.15em]"
                    style={{ background: "var(--primary)", color: "var(--on-primary)", borderRadius: "0.2rem" }}
                  >
                    Featured
                  </span>
                )}
                <span
                  className="ll-label text-[0.55rem] font-medium uppercase tracking-[0.15em]"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  One of a Kind
                </span>
              </div>
              <span
                className="ll-label text-[0.55rem] uppercase tracking-[0.12em]"
                style={{ color: "var(--outline)" }}
              >
                {item.Sku}
              </span>
            </div>

            {/* Name */}
            <h1
              className="ll-display font-normal leading-tight mb-2"
              style={{
                fontSize: "clamp(1.6rem, 3vw, 2.6rem)",
                color: "var(--on-surface)",
                letterSpacing: "-0.015em",
              }}
            >
              {item.Name}
            </h1>

            {/* Price */}
            <p
              className="ll-display text-2xl font-normal mb-6"
              style={{ color: "var(--primary)", letterSpacing: "-0.01em" }}
            >
              {formatPrice(item.UnitPriceCents)}
            </p>

            {/* Description */}
            {item.Description && (
              <p
                className="ll-body text-[1rem] font-light leading-[1.85] mb-8"
                style={{ color: "var(--on-surface-variant)" }}
              >
                {item.Description}
              </p>
            )}

            {/* Spec tiles */}
            {(() => {
              // Parse KeywordsJson once — safe fallback to {} if missing/invalid
              let kw: Record<string, string[]> = {};
              try { if (item.KeywordsJson) kw = JSON.parse(item.KeywordsJson); } catch { /* ignore */ }

              const condition = kw.condition?.[0] ?? null;
              const material  = (kw.materials ?? kw.material)?.[0] ?? null;

              const specs = [
                { label: "Condition", value: condition ?? "Heritage Grade" },
                { label: "Material",  value: material  ?? "Natural Linen"  },
                { label: "Quantity",  value: item.QuantityOnHand > 1 ? `${item.QuantityOnHand} available` : "One of a Kind" },
                { label: "Era",       value: kw.era?.[0] ?? kw.style?.[0] ?? "Antique" },
              ];

              return (
                <div
                  className="grid grid-cols-2 gap-px mb-8"
                  style={{ background: "rgba(196,181,168,0.15)", borderRadius: "0.25rem", overflow: "hidden" }}
                >
                  {specs.map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex flex-col gap-1 px-4 py-3"
                      style={{ background: "var(--surface-bright)" }}
                    >
                      <span className="ll-label text-[0.5rem] font-medium uppercase tracking-[0.15em]" style={{ color: "var(--on-surface-variant)" }}>
                        {label}
                      </span>
                      <span className="ll-body text-sm font-normal capitalize" style={{ color: "var(--on-surface)" }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Desktop CTAs */}
            <div className="hidden md:flex flex-col gap-3">
              <button
                onClick={() => setReserveOpen(true)}
                className="btn-primary py-4 text-[0.68rem] tracking-[0.15em]"
              >
                Reserve This Piece →
              </button>
              <button
                onClick={() => {
                  if (has(item.InventoryId)) {
                    remove(item.InventoryId);
                  } else {
                    add({
                      InventoryId:    item.InventoryId,
                      Sku:            item.Sku,
                      Name:           item.Name,
                      UnitPriceCents: item.UnitPriceCents,
                      thumbnailUrl:   images[0]?.ReadUrl ?? null,
                    });
                  }
                }}
                className="ll-label py-3.5 text-center text-[0.62rem] uppercase tracking-[0.15em] transition-all duration-300"
                style={{
                  background:   has(item.InventoryId) ? "var(--primary)" : "transparent",
                  color:        has(item.InventoryId) ? "var(--on-primary)" : "var(--on-surface-variant)",
                  border:       has(item.InventoryId) ? "1px solid var(--primary)" : "1px solid rgba(196,181,168,0.4)",
                  borderRadius: "0.25rem",
                  cursor:       "pointer",
                }}
              >
                {has(item.InventoryId) ? "✓ Added to Reservation List" : "+ Add to Reservation List"}
              </button>
            </div>


          </div>
        </div>

        {/* ────────────────────────────────────────────────────────
            Related curations
        ──────────────────────────────────────────────────────── */}
        {related.length > 0 && (
          <section className="px-6 md:px-10 py-14" style={{ borderTop: "1px solid rgba(196,181,168,0.15)" }}>
            <div className="flex items-baseline justify-between mb-8">
              <div>
                <h2
                  className="ll-display text-2xl font-normal italic"
                  style={{ color: "var(--on-surface)", letterSpacing: "-0.01em" }}
                >
                  Related Curations
                </h2>
                <p className="ll-label mt-1 text-[0.55rem] uppercase tracking-[0.15em]" style={{ color: "var(--on-surface-variant)" }}>
                  Selected to complement your choice
                </p>
              </div>
              <Link
                href="/shop"
                className="ll-label hidden md:inline text-[0.58rem] uppercase tracking-[0.12em] transition-opacity hover:opacity-60"
                style={{ color: "var(--primary)" }}
              >
                View Collection →
              </Link>
            </div>

            <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
              {related.map((rel) => (
                <Link
                  key={rel.InventoryId}
                  href={`/shop/${rel.Sku}`}
                  className="group block"
                  style={{ textDecoration: "none" }}
                >
                  <div
                    className="overflow-hidden mb-3"
                    style={{ aspectRatio: "4/3", background: "var(--surface-container-highest)", borderRadius: "0.2rem" }}
                  >
                    {getThumbnailUrl(rel.InventoryId) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getThumbnailUrl(rel.InventoryId)!}
                        alt={rel.Name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center ll-display text-sm italic" style={{ color: "var(--outline-variant)" }}>
                        Linen Lady
                      </div>
                    )}
                  </div>
                  <p className="ll-display text-sm font-normal mb-0.5" style={{ color: "var(--on-surface)" }}>{rel.Name}</p>
                  <p className="ll-label text-[0.6rem] uppercase tracking-[0.1em]" style={{ color: "var(--primary)" }}>
                    {formatPrice(rel.UnitPriceCents)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

        {/* ────────────────────────────────────────────────────────
            Care instructions
        ──────────────────────────────────────────────────────── */}
        <section
          className="mt-16 px-6 md:px-10 py-14"
          style={{ background: "var(--surface-container-low)", borderTop: "1px solid rgba(196,181,168,0.15)" }}
        >
          <div className="max-w-2xl">
            <h2
              className="ll-display text-2xl font-normal italic mb-8"
              style={{ color: "var(--on-surface)", letterSpacing: "-0.01em" }}
            >
              Caring for Your Heritage Piece
            </h2>
            <div className="flex flex-col gap-6">
              {CARE_STEPS.map(({ n, title, body }) => (
                <div key={n} className="flex gap-5">
                  <span
                    className="ll-label shrink-0 text-[0.58rem] font-medium uppercase tracking-[0.12em] pt-0.5"
                    style={{ color: "var(--primary)", width: 24 }}
                  >
                    {n}
                  </span>
                  <div>
                    <p className="ll-label mb-1 text-[0.65rem] font-medium uppercase tracking-[0.1em]" style={{ color: "var(--on-surface)" }}>
                      {title}
                    </p>
                    <p className="ll-body text-sm font-light leading-relaxed" style={{ color: "var(--on-surface-variant)" }}>
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      {/* ────────────────────────────────────────────────────────
          Mobile sticky bottom bar — two equal buttons
      ──────────────────────────────────────────────────────── */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch gap-0 px-0"
        style={{
          background:    "var(--surface-bright)",
          borderTop:     "1px solid rgba(196,181,168,0.2)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Add to List — left half */}
        <button
          onClick={() => {
            if (has(item.InventoryId)) {
              remove(item.InventoryId);
            } else {
              add({
                InventoryId:    item.InventoryId,
                Sku:            item.Sku,
                Name:           item.Name,
                UnitPriceCents: item.UnitPriceCents,
                thumbnailUrl:   images[0]?.ReadUrl ?? null,
              });
            }
          }}
          className="ll-label flex-1 flex flex-col items-center justify-center gap-1.5 py-4 text-[0.58rem] uppercase tracking-[0.12em] transition-all duration-300"
          style={{
            background:  has(item.InventoryId) ? "var(--surface-container-low)" : "var(--surface-bright)",
            color:       has(item.InventoryId) ? "var(--primary)"               : "var(--on-surface-variant)",
            cursor:      "pointer",
            border:      "none",
            borderRight: "1px solid rgba(196,181,168,0.2)",
          }}
        >
          <svg
            width="18" height="18" viewBox="0 0 24 24"
            fill={has(item.InventoryId) ? "currentColor" : "none"}
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          {has(item.InventoryId) ? "✓ In List" : "Add to List"}
        </button>

        {/* Reserve — right half */}
        <button
          onClick={() => setReserveOpen(true)}
          className="ll-label flex-1 flex items-center justify-center py-4 text-[0.65rem] uppercase tracking-[0.15em] transition-all duration-300"
          style={{
            background: "var(--primary)",
            color:      "var(--on-primary)",
            cursor:     "pointer",
            border:     "none",
          }}
        >
          Reserve This Piece
        </button>
      </div>

      {/* Reserve modal */}
      <ReserveModal open={reserveOpen} onClose={() => setReserveOpen(false)} item={item} />
    </>
  );
}