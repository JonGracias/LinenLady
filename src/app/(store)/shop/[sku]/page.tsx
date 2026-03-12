"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useInventoryContext } from "@/context/InventoryContext";
import type { InventoryItem, InventoryImage } from "@/types/inventory";

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

function BorderMotif() {
  return (
    <div
      className="h-3 w-full opacity-60"
      style={{
        background: `repeating-linear-gradient(
          90deg,
          #b07878 0px, #b07878 8px,
          transparent 8px, transparent 16px,
          #8fad94 16px, #8fad94 24px,
          transparent 24px, transparent 32px,
          #ecdcdc 32px, #ecdcdc 40px,
          transparent 40px, transparent 48px
        )`,
      }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────
   Image gallery sub-component
───────────────────────────────────────────────────────────── */

function ItemGallery({ images }: { images: InventoryImage[] }) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div
        className="flex aspect-square w-full items-center justify-center text-6xl"
        style={{
          background: "linear-gradient(135deg, var(--rose-light), var(--linen), var(--sage-light))",
          opacity: 0.5,
        }}
      >
        🪡
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Main image */}
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: "4/3", background: "var(--linen)" }}
      >
        <img
          src={images[active]?.ReadUrl ?? ""}
          alt={`Item image ${active + 1}`}
          className="h-full w-full object-contain transition-opacity duration-300"
          style={{ background: "var(--cream-dark)" }}
        />

        {/* Image counter */}
        {images.length > 1 && (
          <div
            className="absolute bottom-3 right-3 ll-label text-[0.58rem] font-medium uppercase tracking-[0.15em] px-2.5 py-1"
            style={{
              background: "rgba(44,31,26,0.6)",
              color: "rgba(255,255,255,0.9)",
            }}
          >
            {active + 1} / {images.length}
          </div>
        )}

        {/* Arrow nav for main image */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setActive((a) => (a - 1 + images.length) % images.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center transition-all hover:scale-110"
              style={{
                background: "rgba(250,246,240,0.85)",
                border: "1px solid var(--linen)",
                color: "var(--ink)",
              }}
            >
              ←
            </button>
            <button
              onClick={() => setActive((a) => (a + 1) % images.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center transition-all hover:scale-110"
              style={{
                background: "rgba(250,246,240,0.85)",
                border: "1px solid var(--linen)",
                color: "var(--ink)",
              }}
            >
              →
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((img, i) => (
            <button
              key={img.ImageId}
              onClick={() => setActive(i)}
              className="overflow-hidden transition-all duration-200"
              style={{
                width: 72,
                height: 72,
                flexShrink: 0,
                border: i === active
                  ? "2px solid var(--rose-deep)"
                  : "2px solid transparent",
                outline: i === active ? "none" : "1px solid var(--linen)",
                background: "var(--linen)",
              }}
            >
              <img
                src={img.ReadUrl ?? ""}
                alt={`Thumbnail ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Similar items strip
───────────────────────────────────────────────────────────── */

function SimilarItems({
  items,
  getThumbnail,
}: {
  items: InventoryItem[];
  getThumbnail: (id: number) => string | null;
}) {
  if (!items.length) return null;

  return (
    <section
      className="relative z-[1] px-16 py-20"
      style={{ background: "var(--cream-dark)" }}
    >
      <div
        className="ll-label mb-3 flex items-center gap-3 text-[0.62rem] font-medium uppercase tracking-[0.25em]"
        style={{ color: "var(--sage-deep)" }}
      >
        <span className="inline-block h-px w-8" style={{ background: "var(--sage-deep)" }} />
        You Might Also Like
      </div>
      <h2
        className="ll-display mb-10 font-normal"
        style={{ fontSize: "clamp(1.5rem,2.5vw,2.2rem)", color: "var(--ink)" }}
      >
        Similar{" "}
        <em className="italic" style={{ color: "var(--rose-deep)" }}>
          Pieces
        </em>
      </h2>

      <div
        className="grid gap-5"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
      >
        {items.map((item) => {
          const thumb = getThumbnail(item.InventoryId);
          return (
            <Link
              key={item.InventoryId}
              href={`/shop/${item.Sku}`}
              className="group block overflow-hidden border transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(44,31,26,0.10)]"
              style={{ borderColor: "var(--linen)", background: "var(--cream)", textDecoration: "none" }}
            >
              <div
                className="aspect-[4/3] overflow-hidden"
                style={{ background: "var(--linen)" }}
              >
                {thumb ? (
                  <img src={thumb} alt={item.Name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl opacity-20">🪡</div>
                )}
              </div>
              <div className="px-4 py-3">
                <div
                  className="ll-display mb-1 text-sm font-normal leading-snug"
                  style={{ color: "var(--ink)" }}
                >
                  {item.Name}
                </div>
                <div
                  className="ll-label text-sm font-medium"
                  style={{ color: "var(--rose-deep)" }}
                >
                  {formatPrice(item.UnitPriceCents)}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main page
───────────────────────────────────────────────────────────── */

export default function ItemDetailPage() {
  const params   = useParams();
  const router   = useRouter();
  const sku = params?.sku as string | undefined;

  const { sorted, ensureThumbnail, getThumbnailUrl, ensureImages, getImages, refreshImages } =
    useInventoryContext();

  // Find item by SKU
  const item = sorted.find((i) => i.Sku === sku) ?? null;

  // Images state — load fresh signed URLs
  const [images, setImages] = useState<InventoryImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);

  // Similar items
  const [similar, setSimilar] = useState<InventoryItem[]>([]);

  // Inquire modal
  const [inquireOpen, setInquireOpen] = useState(false);
  const [inquireSent, setInquireSent] = useState(false);
  const [inquireMsg, setInquireMsg] = useState("");

  // Load images when item is found
  useEffect(() => {
    if (!item) return;
    setImagesLoading(true);
    refreshImages(item.InventoryId, 120).then((imgs) => {
      setImages(imgs);
      setImagesLoading(false);
    });
  }, [item?.InventoryId]);

  // Load similar items
  useEffect(() => {
    if (!item) return;
    fetch(`/admin/api/items/${item.InventoryId}/similar?top=4&minScore=0.75&publishedOnly=true`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        const ids: number[] = Array.isArray(data)
          ? data.map((d: any) => d.InventoryId ?? d.inventoryId)
          : [];
        const found = ids
          .map((id) => sorted.find((i) => i.InventoryId === id))
          .filter((i): i is InventoryItem => !!i && i.InventoryId !== item.InventoryId)
          .slice(0, 4);
        found.forEach((i) => ensureThumbnail(i.InventoryId));
        setSimilar(found);
      })
      .catch(() => {});
  }, [item?.InventoryId, sorted]);

  // ── Not found state ──
  if (!item && sorted.length > 0) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-6"
        style={{ background: "var(--cream)" }}
      >
        <div className="text-5xl opacity-25">🪡</div>
        <p className="ll-display text-2xl italic" style={{ color: "var(--brown-light)" }}>
          This piece has found its home.
        </p>
        <Link
          href="/shop"
          className="ll-label border px-8 py-3 text-[0.68rem] uppercase tracking-[0.15em] transition-colors hover:bg-[#ecdcdc]"
          style={{ color: "var(--sage-deep)", borderColor: "var(--sage)", textDecoration: "none" }}
        >
          Browse the Collection
        </Link>
      </div>
    );
  }

  // ── Loading state ──
  if (!item) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--cream)" }}
      >
        <div
          className="ll-label text-[0.72rem] uppercase tracking-[0.2em]"
          style={{ color: "var(--ink-soft)" }}
        >
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div
      className="ll-texture-overlay relative min-h-screen overflow-x-hidden"
      style={{ backgroundColor: "var(--cream)", color: "var(--ink)" }}
    >
      <div className="ll-texture-overlay pointer-events-none fixed inset-0 z-0" />

      <BorderMotif />

      {/* ── Nav ── */}
      <nav
        className="relative z-10 flex items-center justify-between border-b px-12 py-5"
        style={{ borderColor: "var(--linen)", backgroundColor: "var(--cream)" }}
      >
        <Link
          href="/"
          className="ll-display text-lg italic"
          style={{ color: "var(--brown)", letterSpacing: "0.02em", textDecoration: "none" }}
        >
          Noemi{" "}
          <span style={{ fontStyle: "normal", color: "var(--rose-deep)" }}>
            · The Linen Lady
          </span>
        </Link>
        <ul className="flex list-none gap-10">
          {[
            { href: "/shop",      label: "Shop"      },
            { href: "/about",     label: "Our Story"  },
            { href: "/#schedule", label: "Find Us"    },
            { href: "/#contact",  label: "Inquire"    },
          ].map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="ll-label text-[0.72rem] font-medium uppercase tracking-[0.15em] transition-colors duration-200 hover:text-[#b07878]"
                style={{ color: "var(--ink-soft)", textDecoration: "none" }}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Breadcrumb ── */}
      <div
        className="relative z-[1] flex items-center gap-2 border-b px-16 py-3"
        style={{ borderColor: "var(--linen)", background: "var(--cream)" }}
      >
        <Link
          href="/shop"
          className="ll-label text-[0.62rem] uppercase tracking-[0.12em] transition-colors hover:text-[#b07878]"
          style={{ color: "var(--ink-soft)", textDecoration: "none" }}
        >
          Shop
        </Link>
        <span className="ll-label text-[0.62rem]" style={{ color: "var(--linen)" }}>
          /
        </span>
        <span
          className="ll-label text-[0.62rem] uppercase tracking-[0.12em]"
          style={{ color: "var(--rose-deep)" }}
        >
          {item.Name}
        </span>
      </div>

      {/* ══════════════════════════════════════════════════════
          MAIN CONTENT — image + details
      ══════════════════════════════════════════════════════ */}
      <section
        className="relative z-[1] grid gap-16 px-16 py-16"
        style={{ gridTemplateColumns: "1.1fr 1fr", alignItems: "start" }}
      >
        {/* Left — gallery */}
        <div className="sticky top-8">
          {imagesLoading ? (
            <div
              className="aspect-[4/3] w-full animate-pulse"
              style={{ background: "var(--linen)" }}
            />
          ) : (
            <ItemGallery images={images} />
          )}
        </div>

        {/* Right — details */}
        <div className="flex flex-col">
          {/* SKU */}
          <div
            className="ll-label mb-3 text-[0.6rem] font-medium uppercase tracking-[0.2em]"
            style={{ color: "var(--ink-soft)" }}
          >
            {item.Sku}
          </div>

          {/* Name */}
          <h1
            className="ll-display mb-3 font-normal leading-snug"
            style={{ fontSize: "clamp(1.8rem,3vw,2.8rem)", color: "var(--ink)" }}
          >
            {item.Name}
          </h1>

          {/* Price */}
          <div
            className="ll-label mb-6 text-2xl font-medium"
            style={{ color: "var(--rose-deep)" }}
          >
            {formatPrice(item.UnitPriceCents)}
          </div>

          {/* Badges */}
          <div className="mb-6 flex flex-wrap gap-2">
            {item.IsFeatured && (
              <span
                className="ll-label px-3 py-1 text-[0.58rem] font-medium uppercase tracking-[0.15em] text-white"
                style={{ background: "var(--rose-deep)" }}
              >
                Featured
              </span>
            )}
            {item.QuantityOnHand > 0 ? (
              <span
                className="ll-label border px-3 py-1 text-[0.58rem] font-medium uppercase tracking-[0.15em]"
                style={{ borderColor: "var(--sage)", color: "var(--sage-deep)" }}
              >
                Available
              </span>
            ) : (
              <span
                className="ll-label border px-3 py-1 text-[0.58rem] font-medium uppercase tracking-[0.15em]"
                style={{ borderColor: "var(--linen)", color: "var(--ink-soft)" }}
              >
                Sold
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="mb-6 h-px" style={{ background: "var(--linen)" }} />

          {/* Description */}
          {item.Description && (
            <p
              className="ll-body mb-8 text-[1.05rem] font-light leading-[1.85]"
              style={{ color: "var(--ink-soft)" }}
            >
              {item.Description}
            </p>
          )}

          {/* ── CTA buttons ── */}
          {item.QuantityOnHand > 0 ? (
            <button
              onClick={() => setInquireOpen(true)}
              className="ll-label mb-3 w-full border-2 py-4 text-[0.75rem] font-medium uppercase tracking-[0.2em] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(176,120,120,0.25)]"
              style={{
                background: "var(--rose-deep)",
                borderColor: "var(--rose-deep)",
                color: "#fff",
              }}
            >
              Inquire About This Piece
            </button>
          ) : (
            <div
              className="ll-label mb-3 w-full border py-4 text-center text-[0.75rem] font-medium uppercase tracking-[0.2em]"
              style={{
                borderColor: "var(--linen)",
                color: "var(--ink-soft)",
                background: "var(--cream-dark)",
              }}
            >
              This Piece Has Found Its Home
            </div>
          )}

          <Link
            href="/shop"
            className="ll-label block w-full border py-3.5 text-center text-[0.68rem] font-medium uppercase tracking-[0.15em] transition-colors duration-200"
            style={{
              borderColor: "var(--sage)",
              color: "var(--sage-deep)",
              textDecoration: "none",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "var(--sage-light)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "transparent")
            }
          >
            ← Back to Collection
          </Link>

          {/* ── Details block ── */}
          <div
            className="mt-10 border-t pt-8"
            style={{ borderColor: "var(--linen)" }}
          >
            <div
              className="ll-label mb-4 text-[0.62rem] font-medium uppercase tracking-[0.2em]"
              style={{ color: "var(--sage-deep)" }}
            >
              Details
            </div>
            <div className="flex flex-col gap-0">
              {[
                { label: "Item No.",    value: item.Sku },
                { label: "Availability", value: item.QuantityOnHand > 0 ? "In stock" : "Sold" },
                { label: "Added",       value: new Date(item.CreatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
              ].map(({ label, value }, i, arr) => (
                <div
                  key={label}
                  className="flex justify-between py-2.5"
                  style={{
                    borderBottom: i < arr.length - 1 ? "1px dashed var(--linen)" : "none",
                  }}
                >
                  <span
                    className="ll-label text-[0.65rem] font-medium uppercase tracking-[0.1em]"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    {label}
                  </span>
                  <span
                    className="ll-body text-sm italic"
                    style={{ color: "var(--ink)" }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Care note ── */}
          <div
            className="mt-8 border p-5"
            style={{ borderColor: "var(--linen)", background: "var(--cream-dark)" }}
          >
            <div
              className="ll-label mb-2 text-[0.6rem] font-medium uppercase tracking-[0.15em]"
              style={{ color: "var(--sage-deep)" }}
            >
              A Note on Care
            </div>
            <p
              className="ll-body text-sm font-light leading-relaxed"
              style={{ color: "var(--ink-soft)" }}
            >
              Antique linens are delicate. Hand wash in cool water with a gentle
              soap, or dry clean. Never wring. Roll in a clean towel to remove
              excess moisture, then lay flat or hang to dry.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SIMILAR ITEMS
      ══════════════════════════════════════════════════════ */}
      <SimilarItems items={similar} getThumbnail={getThumbnailUrl} />

      <BorderMotif />

      {/* ── Footer ── */}
      <footer
        className="relative z-[1] px-16 pb-8 pt-12"
        style={{ background: "var(--ink)", color: "var(--cream-dark)" }}
      >
        <div
          className="mb-8 flex items-center justify-between border-b pb-8"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <div className="ll-display text-xl italic" style={{ color: "var(--rose-light)" }}>
            Noemi · The Linen Lady
          </div>
          <address
            className="ll-body not-italic text-sm font-light"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Georgetown Flea Market · 1819 35th St NW · Sundays 8am–4pm
          </address>
        </div>
        <div
          className="ll-label flex flex-wrap items-center justify-between gap-2 text-[0.6rem] uppercase tracking-[0.1em]"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          <span>© 2025 Noemi · The Linen Lady · Washington D.C.</span>
          <span>Handpicked since 1994</span>
        </div>
      </footer>

      {/* ══════════════════════════════════════════════════════
          INQUIRE MODAL
      ══════════════════════════════════════════════════════ */}
      {inquireOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(44,31,26,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setInquireOpen(false); }}
        >
          <div
            className="relative w-full max-w-lg border"
            style={{ background: "var(--cream)", borderColor: "var(--linen)" }}
          >
            {/* Corner accents */}
            <div
              className="absolute left-[-1px] top-[-1px] h-8 w-8 border-l-[3px] border-t-[3px]"
              style={{ borderColor: "var(--rose)" }}
            />
            <div
              className="absolute bottom-[-1px] right-[-1px] h-8 w-8 border-b-[3px] border-r-[3px]"
              style={{ borderColor: "var(--sage)" }}
            />

            <div className="p-10">
              {inquireSent ? (
                <div className="py-6 text-center">
                  <div className="mb-4 text-4xl">🌿</div>
                  <h3
                    className="ll-display mb-3 text-2xl italic font-normal"
                    style={{ color: "var(--ink)" }}
                  >
                    Message sent
                  </h3>
                  <p
                    className="ll-body text-base font-light"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    Noemi will be in touch soon.
                  </p>
                  <button
                    onClick={() => { setInquireOpen(false); setInquireSent(false); setInquireMsg(""); }}
                    className="ll-label mt-8 border px-8 py-3 text-[0.65rem] uppercase tracking-[0.15em] transition-colors hover:bg-[#ecdcdc]"
                    style={{ borderColor: "var(--linen)", color: "var(--ink-soft)" }}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  {/* Close */}
                  <button
                    onClick={() => setInquireOpen(false)}
                    className="absolute right-4 top-4 ll-label text-lg leading-none transition-opacity hover:opacity-60"
                    style={{ color: "var(--ink-soft)", background: "none", border: "none" }}
                  >
                    ✕
                  </button>

                  <div
                    className="ll-label mb-1 text-[0.6rem] font-medium uppercase tracking-[0.2em]"
                    style={{ color: "var(--sage-deep)" }}
                  >
                    Inquire
                  </div>
                  <h3
                    className="ll-display mb-6 text-xl font-normal italic"
                    style={{ color: "var(--ink)" }}
                  >
                    {item.Name}
                  </h3>

                  {/* Pre-filled mailto form */}
                  <div className="flex flex-col gap-4">
                    <p
                      className="ll-body text-sm font-light leading-relaxed"
                      style={{ color: "var(--ink-soft)" }}
                    >
                      Add a message and we&apos;ll open your email client with everything
                      filled in — or just hit send as-is.
                    </p>

                    <textarea
                      value={inquireMsg}
                      onChange={(e) => setInquireMsg(e.target.value)}
                      rows={4}
                      placeholder="Any questions about this piece? (optional)"
                      className="ll-body w-full resize-none border p-4 text-sm font-light outline-none placeholder:italic"
                      style={{
                        borderColor: "var(--linen)",
                        color: "var(--ink)",
                        background: "var(--cream-dark)",
                        caretColor: "var(--rose-deep)",
                      }}
                    />

                    <a
                      href={`mailto:noemi@linenlady.com?subject=${encodeURIComponent(
                        `Inquiry: ${item.Name} (${item.Sku})`
                      )}&body=${encodeURIComponent(
                        `Hi Noemi,\n\nI'm interested in the following piece:\n\n${item.Name}\nItem No: ${item.Sku}\nPrice: ${formatPrice(item.UnitPriceCents)}\n\n${inquireMsg ? inquireMsg + "\n\n" : ""}Thank you!`
                      )}`}
                      onClick={() => setInquireSent(true)}
                      className="ll-label block w-full py-4 text-center text-[0.72rem] font-medium uppercase tracking-[0.2em] text-white transition-all duration-200 hover:-translate-y-px"
                      style={{ background: "var(--rose-deep)", textDecoration: "none" }}
                    >
                      Open Email to Inquire
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}