// src/components/storefront/DesktopItemCard.tsx
"use client";

import Link from "next/link";
import type { InventoryItem } from "@/types/inventory";
import { useCart } from "@/context/CartContext";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

type Props = {
  item:         InventoryItem;
  thumbnailUrl: string | null;
};

export default function DesktopItemCard({ item, thumbnailUrl }: Props) {
  const { add, remove, has } = useCart();
  const inCart = has(item.InventoryId);

  const toggleCart = (e: React.MouseEvent) => {
    e.preventDefault(); // don't navigate
    if (inCart) {
      remove(item.InventoryId);
    } else {
      add({
        InventoryId:    item.InventoryId,
        Sku:            item.Sku,
        Name:           item.Name,
        UnitPriceCents: item.UnitPriceCents,
        thumbnailUrl,
      });
    }
  };

  return (
    <Link
      href={`/shop/${item.Sku}`}
      className="group relative block overflow-hidden transition-all duration-400"
      style={{ textDecoration: "none", background: "var(--surface-bright)", borderRadius: "0.25rem" }}
    >
      {/* Image */}
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: "3/4", background: "var(--surface-container-highest)" }}
      >
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt={item.Name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-103"
            style={{ transitionTimingFunction: "ease-in-out" }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center ll-display text-2xl italic" style={{ color: "var(--outline-variant)" }}>
            {process.env.NEXT_PUBLIC_STORE_NAME}
          </div>
        )}

        {/* Hover overlay with View + Cart buttons */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-end pb-5 gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-400"
          style={{ background: "linear-gradient(to top, rgba(30,27,26,0.55) 0%, transparent 55%)" }}
        >
          <span className="btn-primary text-[0.6rem] px-5 py-2.5">
            View Piece
          </span>
          <button
            onClick={toggleCart}
            className="ll-label text-[0.55rem] uppercase tracking-[0.12em] px-4 py-1.5 transition-all duration-300"
            style={{
              background:   inCart ? "var(--primary)" : "rgba(253,250,246,0.15)",
              color:        inCart ? "var(--on-primary)" : "rgba(253,250,246,0.9)",
              border:       inCart ? "1px solid var(--primary)" : "1px solid rgba(253,250,246,0.35)",
              borderRadius: "0.2rem",
              backdropFilter: "blur(4px)",
            }}
          >
            {inCart ? "✓ In List" : "+ Add to Cart"}
          </button>
        </div>

        {/* Featured badge */}
        {item.IsFeatured && (
          <div className="absolute left-0 top-4">
            <span
              className="ll-label px-3 py-1 text-[0.52rem] font-medium uppercase tracking-[0.15em]"
              style={{ background: "var(--primary)", color: "var(--on-primary)" }}
            >
              Featured
            </span>
          </div>
        )}


      </div>

      {/* Info panel */}
      <div
        className="px-4 pb-5 pt-3 transition-all duration-400 group-hover:shadow-ambient"
        style={{ background: "var(--surface-bright)" }}
      >
        <div
          className="ll-display mb-1 text-sm font-normal leading-snug line-clamp-2 min-h-[2.5rem]"
          style={{ color: "var(--on-surface)", letterSpacing: "-0.005em" }}
        >
          {item.Name}
        </div>

        {item.Description && (
          <p className="ll-body mb-3 line-clamp-1 text-xs font-light" style={{ color: "var(--on-surface-variant)" }}>
            {item.Description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className="ll-label text-sm font-medium" style={{ color: "var(--primary)" }}>
            {formatPrice(item.UnitPriceCents)}
          </span>

          {/* Inline cart toggle (always visible, no hover needed) */}
          <button
            onClick={toggleCart}
            className="ll-label text-[0.52rem] uppercase tracking-[0.12em] px-2.5 py-1 transition-all duration-300"
            style={{
              background:   inCart ? "var(--primary)" : "transparent",
              color:        inCart ? "var(--on-primary)" : "var(--on-surface-variant)",
              border:       inCart ? "1px solid var(--primary)" : "1px solid rgba(196,181,168,0.3)",
              borderRadius: "0.2rem",
            }}
          >
            {inCart ? "✓ Listed" : "+ List"}
          </button>
        </div>
      </div>
    </Link>
  );
}