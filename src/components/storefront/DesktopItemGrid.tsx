"use client";

import DesktopItemCard from "./DesktopItemCard";
import type { InventoryItem } from "@/types/inventory";

type Props = {
  items: InventoryItem[];
  getThumbnailUrl: (id: number) => string | null;
  onClearFilters?: () => void;
  loading?: boolean;
};

export default function DesktopItemGrid({ items, getThumbnailUrl, onClearFilters, loading }: Props) {
  if (loading) {
    return (
      <div
        className="grid gap-5 px-10 py-10"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse overflow-hidden border" style={{ borderColor: "var(--linen)" }}>
            <div style={{ aspectRatio: "3/4", background: "var(--linen)" }} />
            <div className="space-y-2 p-4">
              <div className="h-4 w-3/4 rounded" style={{ background: "var(--linen)" }} />
              <div className="h-3 w-1/2 rounded" style={{ background: "var(--linen)" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-32 text-center">
        <div className="mb-4 text-4xl opacity-20">🪡</div>
        <p className="ll-display text-xl italic" style={{ color: "var(--ink-soft)" }}>
          No pieces found.
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="ll-label mt-4 text-[0.7rem] uppercase tracking-[0.15em] underline"
            style={{ color: "var(--rose-deep)", background: "none", border: "none", cursor: "pointer" }}
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="grid gap-5 px-10 py-10"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
    >
      {items.map((item) => (
        <DesktopItemCard
          key={item.InventoryId}
          item={item}
          thumbnailUrl={getThumbnailUrl(item.InventoryId)}
        />
      ))}
    </div>
  );
}