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

function MobileItemCard({
  item,
  thumbnailUrl,
}: {
  item: InventoryItem;
  thumbnailUrl: string | null;
}) {
  return (
    <Link
      href={`/shop/${item.sku}`}
      className="relative w-full shrink-0 snap-start flex flex-col"
      style={{ height: "100svh", background: "var(--rose-light)", textDecoration: "none" }}
    >
      {/* Image */}
      <div className="flex flex-1 items-center justify-center overflow-hidden">
        <div
          className="relative w-full overflow-hidden"
          style={{ aspectRatio: "3/4", maxHeight: "82svh" }}
        >
          {thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnailUrl}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-6xl opacity-20"
              style={{ background: "var(--linen)" }}
            >
              🪡
            </div>
          )}
          {item.isFeatured && (
            <div
              className="absolute left-0 top-4 px-3 py-1 text-[0.55rem] font-medium uppercase tracking-[0.15em] text-white"
              style={{ background: "var(--rose-deep)" }}
            >
              Featured
            </div>
          )}
        </div>
      </div>

      {/* Info bar */}
      <div
        className="shrink-0 px-6 py-4 flex items-center justify-between gap-4"
        style={{ background: "var(--cream)", borderTop: "1px solid var(--linen)" }}
      >
        <div className="min-w-0">
          <div
            className="ll-display text-base font-normal leading-snug line-clamp-1"
            style={{ color: "var(--ink)" }}
          >
            {item.name}
          </div>
          <div
            className="ll-label mt-0.5 text-[0.65rem] uppercase tracking-[0.15em]"
            style={{ color: "var(--rose-deep)" }}
          >
            {formatPrice(item.unitPriceCents)}
          </div>
        </div>
        <div
          className="ll-label shrink-0 border px-4 py-2 text-[0.6rem] font-medium uppercase tracking-[0.15em]"
          style={{ color: "var(--sage-deep)", borderColor: "var(--sage)" }}
        >
          View →
        </div>
      </div>
    </Link>
  );
}

type Props = {
  items: InventoryItem[];
  getThumbnailUrl: (id: number) => string | null;
};

export default function MobileItemSlider({ items, getThumbnailUrl }: Props) {
  return (
    <div
      className="overflow-y-scroll snap-y snap-mandatory"
      style={{
        height: "100svh",
        scrollbarWidth: "none",
        overscrollBehaviorY: "auto",
      }}
    >
      {items.map((item) => (
        <MobileItemCard
          key={item.inventoryId}
          item={item}
          thumbnailUrl={getThumbnailUrl(item.inventoryId)}
        />
      ))}

      {/* Zero-height sentinel — snaps here after last card, then next
          scroll gesture bubbles up to page and continues to next section */}
      <div style={{ scrollSnapAlign: "start", height: 0 }} aria-hidden="true" />
    </div>
  );
}