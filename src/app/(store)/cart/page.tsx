// src/app/(store)/cart/page.tsx
"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export default function CartPage() {
  const { items, remove, clear, count } = useCart();

  const total = items.reduce((sum, i) => sum + i.UnitPriceCents, 0);

  /* Build the reserve-all mailto */
  const buildMailto = () => {
    const subject = encodeURIComponent("Reservation Inquiry — Multiple Pieces");
    const itemLines = items
      .map((i, idx) => `${idx + 1}. ${i.Name} (SKU: ${i.Sku}) — ${formatPrice(i.UnitPriceCents)}`)
      .join("\n");
    const body = encodeURIComponent(
      `Hello Noemi,\n\nI am interested in reserving the following pieces:\n\n${itemLines}\n\nTotal: ${formatPrice(total)}\n\nPlease let me know about availability and next steps.\n\nThank you.`
    );
    return `mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  /* ── Empty state ── */
  if (count === 0) {
    return (
      <div
        className="ll-texture-overlay min-h-[60vh] flex flex-col items-center justify-center px-6 text-center"
        style={{ background: "var(--surface)", color: "var(--on-surface)" }}
      >
        <p
          className="ll-display text-3xl font-normal italic mb-3"
          style={{ color: "var(--on-surface-variant)", letterSpacing: "-0.01em" }}
        >
          Your list is empty
        </p>
        <p className="ll-body text-base font-light mb-8" style={{ color: "var(--outline)" }}>
          Browse the collection and add pieces you&apos;re interested in.
        </p>
        <Link href="/shop" className="btn-primary">
          Browse the Collection →
        </Link>
      </div>
    );
  }

  return (
    <div
      className="ll-texture-overlay min-h-screen"
      style={{ background: "var(--surface)", color: "var(--on-surface)" }}
    >
      {/* ── Header ── */}
      <div
        className="px-6 md:px-10 pt-10 pb-6"
        style={{ borderBottom: "1px solid rgba(196,181,168,0.15)" }}
      >
        <p
          className="ll-label mb-2 text-[0.6rem] font-medium uppercase tracking-[0.25em]"
          style={{ color: "var(--primary)" }}
        >
          Your Selection
        </p>
        <h1
          className="ll-display font-normal leading-tight"
          style={{ fontSize: "clamp(1.8rem, 3vw, 3rem)", color: "var(--on-surface)", letterSpacing: "-0.01em" }}
        >
          Reservation{" "}
          <em className="italic" style={{ color: "var(--primary)" }}>List</em>
        </h1>
        <p className="ll-body mt-2 text-sm font-light" style={{ color: "var(--on-surface-variant)" }}>
          {count} {count === 1 ? "piece" : "pieces"} selected
        </p>
      </div>

      <div className="px-6 md:px-10 py-8 md:grid md:gap-12 md:items-start" style={{ gridTemplateColumns: "1fr 360px" }}>

        {/* ── Item list ── */}
        <div className="flex flex-col gap-0" style={{ borderTop: "1px solid rgba(196,181,168,0.15)" }}>
          {items.map((item) => (
            <div
              key={item.InventoryId}
              className="flex items-center gap-5 py-5"
              style={{ borderBottom: "1px solid rgba(196,181,168,0.15)" }}
            >
              {/* Thumbnail */}
              <div
                className="shrink-0 overflow-hidden"
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "0.2rem",
                  background: "var(--surface-container-highest)",
                }}
              >
                {item.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumbnailUrl}
                    alt={item.Name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center ll-display text-[0.5rem] italic"
                    style={{ color: "var(--outline-variant)" }}
                  >
                    LL
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/shop/${item.Sku}`}
                  className="ll-display text-sm font-normal leading-snug line-clamp-2 transition-opacity hover:opacity-60"
                  style={{ color: "var(--on-surface)", textDecoration: "none" }}
                >
                  {item.Name}
                </Link>
                <p
                  className="ll-label mt-1 text-[0.55rem] uppercase tracking-[0.12em]"
                  style={{ color: "var(--outline)" }}
                >
                  {item.Sku}
                </p>
              </div>

              {/* Price + remove */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span
                  className="ll-display text-sm font-normal"
                  style={{ color: "var(--primary)" }}
                >
                  {formatPrice(item.UnitPriceCents)}
                </span>
                <button
                  onClick={() => remove(item.InventoryId)}
                  className="ll-label text-[0.55rem] uppercase tracking-[0.1em] transition-opacity hover:opacity-60"
                  style={{ color: "var(--on-surface-variant)", background: "none", border: "none", cursor: "pointer" }}
                  aria-label={`Remove ${item.Name}`}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          {/* Clear all */}
          <button
            onClick={clear}
            className="ll-label mt-4 self-start text-[0.58rem] uppercase tracking-[0.12em] transition-opacity hover:opacity-60"
            style={{ color: "var(--on-surface-variant)", background: "none", border: "none", cursor: "pointer" }}
          >
            Clear List
          </button>
        </div>

        {/* ── Summary + CTA ── */}
        <div
          className="mt-8 md:mt-0 p-6 md:p-8 sticky top-6"
          style={{
            background:   "var(--surface-bright)",
            borderRadius: "0.25rem",
            outline:      "1px solid rgba(196,181,168,0.2)",
          }}
        >
          {/* Ghost corners */}
          <div className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2" style={{ borderColor: "var(--primary)", opacity: 0.3 }} />
          <div className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2" style={{ borderColor: "var(--primary)", opacity: 0.3 }} />

          <p
            className="ll-label mb-4 text-[0.6rem] font-medium uppercase tracking-[0.2em]"
            style={{ color: "var(--on-surface-variant)" }}
          >
            Summary
          </p>

          {/* Item lines */}
          <div className="flex flex-col gap-2 mb-5">
            {items.map((item) => (
              <div key={item.InventoryId} className="flex items-baseline justify-between gap-4">
                <span
                  className="ll-body text-xs font-light truncate"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  {item.Name}
                </span>
                <span
                  className="ll-label text-[0.62rem] shrink-0"
                  style={{ color: "var(--on-surface)" }}
                >
                  {formatPrice(item.UnitPriceCents)}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div
            className="flex items-baseline justify-between pt-4 mb-6"
            style={{ borderTop: "1px solid rgba(196,181,168,0.2)" }}
          >
            <span
              className="ll-label text-[0.62rem] font-medium uppercase tracking-[0.12em]"
              style={{ color: "var(--on-surface-variant)" }}
            >
              Total Interest
            </span>
            <span
              className="ll-display text-lg font-normal"
              style={{ color: "var(--primary)", letterSpacing: "-0.01em" }}
            >
              {formatPrice(total)}
            </span>
          </div>

          <p
            className="ll-body mb-5 text-xs font-light italic leading-relaxed"
            style={{ color: "var(--outline)" }}
          >
            No payment is collected now. Sending this inquiry opens your email — Noemi will confirm availability and arrange next steps.
          </p>

          <a
            href={buildMailto()}
            className="btn-primary block text-center py-4 text-[0.65rem] tracking-[0.15em] mb-3"
          >
            Reserve These Pieces →
          </a>

          <Link
            href="/shop"
            className="ll-label block text-center py-2.5 text-[0.6rem] uppercase tracking-[0.12em] transition-opacity hover:opacity-60"
            style={{ color: "var(--on-surface-variant)" }}
          >
            Continue Browsing
          </Link>
        </div>
      </div>
    </div>
  );
}