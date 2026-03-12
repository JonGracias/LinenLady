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

export default function FeaturedItemCard({ item, thumbnailUrl }: Props) {
  return (
    <Link
      href={`/shop/${item.Sku}`}
      className="group block overflow-hidden border border-[#e8ddd0] bg-[#faf6f0] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(44,31,26,0.10)]"
    >
      {/* image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#ecdcdc] via-[#e8ddd0] to-[#c8daca]">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt={item.Name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl opacity-25">
            🪡
          </div>
        )}
        {item.IsFeatured && (
          <div
            className="absolute left-3 top-3 px-2 py-0.5 text-[0.55rem] font-medium uppercase tracking-[0.15em] text-white"
            style={{ fontFamily: "'Jost', sans-serif", background: "#b07878" }}
          >
            Featured
          </div>
        )}
      </div>

      {/* body */}
      <div className="px-5 pb-5 pt-4">
        <div
          className="mb-1 text-base font-normal leading-snug"
          style={{ fontFamily: "'Playfair Display', serif", color: "#2c1f1a" }}
        >
          {item.Name}
        </div>

        {item.Description && (
          <p
            className="mb-3 line-clamp-2 text-sm font-light leading-relaxed"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: "#5c4a42" }}
          >
            {item.Description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span
            className="text-sm font-medium"
            style={{ fontFamily: "'Jost', sans-serif", color: "#b07878" }}
          >
            {formatPrice(item.UnitPriceCents)}
          </span>
          <span
            className="border px-3 py-1 text-[0.6rem] font-medium uppercase tracking-[0.15em] transition-colors duration-200 group-hover:bg-[#8fad94] group-hover:text-white"
            style={{
              fontFamily: "'Jost', sans-serif",
              color: "#5a7a60",
              borderColor: "#8fad94",
            }}
          >
            View
          </span>
        </div>
      </div>
    </Link>
  );
}