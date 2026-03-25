"use client";

import Link from "next/link";
import type { InventoryItem } from "@/types/inventory";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

type Props = {
  item: InventoryItem;
  thumbnailUrl: string | null;
};

export default function DesktopItemCard({ item, thumbnailUrl }: Props) {
  return (
    <Link
      href={`/shop/${item.Sku}`}
      className="group relative block overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{ textDecoration: "none", background: "var(--cream)" }}
    >
      {/* Image */}
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: "3/4", background: "var(--linen)" }}
      >
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt={item.Name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl opacity-15">
            🪡
          </div>
        )}

        {/* Hover overlay with quick-view hint */}
        <div
          className="absolute inset-0 flex items-end justify-center pb-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: "linear-gradient(to top, rgba(44,31,26,0.55) 0%, transparent 60%)" }}
        >
          <span
            className="ll-label px-5 py-2 text-[0.6rem] uppercase tracking-[0.2em]"
            style={{ background: "var(--cream)", color: "var(--rose-deep)" }}
          >
            View Piece
          </span>
        </div>

        {/* Featured badge */}
        {item.IsFeatured && (
          <div
            className="absolute left-0 top-4 px-3 py-1 text-[0.55rem] font-medium uppercase tracking-[0.15em] text-white"
            style={{ background: "var(--rose-deep)" }}
          >
            Featured
          </div>
        )}
      </div>

      {/* Info */}
      <div
        className="border-x border-b px-4 pb-4 pt-3 transition-colors duration-300"
        style={{
          borderColor: "var(--linen)",
          background: "var(--cream)",
        }}
      >
        {/* Corner accent on hover */}
        <div
          className="absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ borderColor: "var(--sage)" }}
        />

        <div
          className="ll-display mb-1 text-sm font-normal leading-snug line-clamp-2 min-h-[2.5rem]"
          style={{ color: "var(--ink)" }}
        >
          {item.Name}
        </div>

        {item.Description && (
          <p
            className="ll-body mb-3 line-clamp-1 text-xs font-light"
            style={{ color: "var(--ink-soft)" }}
          >
            {item.Description}
          </p>
        )}

        <div
          className="ll-label text-sm font-medium"
          style={{ color: "var(--rose-deep)" }}
        >
          {formatPrice(item.UnitPriceCents)}
        </div>
      </div>
    </Link>
  );
}
