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
        className="grid gap-6 px-10 py-10"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse overflow-hidden" style={{ borderRadius: "0.25rem", background: "var(--surface-bright)" }}>
            <div style={{ aspectRatio: "3/4", background: "var(--surface-container)" }} />
            <div className="p-4 space-y-2">
              <div className="h-3.5 w-3/4 rounded-sm" style={{ background: "var(--surface-container)" }} />
              <div className="h-3 w-1/2 rounded-sm" style={{ background: "var(--surface-container-low)" }} />
              <div className="h-3 w-1/4 rounded-sm" style={{ background: "var(--surface-container-low)" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-36 text-center">
        <p className="ll-display text-2xl font-normal italic mb-4" style={{ color: "var(--on-surface-variant)" }}>
          No pieces found.
        </p>
        <p className="ll-body text-base font-light mb-6" style={{ color: "var(--outline)" }}>
          Try a different category or clear your search.
        </p>
        {onClearFilters && (
          <button onClick={onClearFilters} className="btn-tertiary mx-auto">
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="grid gap-6 px-10 py-10"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
    >
      {items.map((item) => (
        <DesktopItemCard
          key={item.inventoryId}
          item={item}
          thumbnailUrl={getThumbnailUrl(item.inventoryId)}
        />
      ))}
    </div>
  );
}