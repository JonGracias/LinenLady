// src/components/storefront/ShopSection.tsx
"use client";

import { useState, useMemo } from "react";
import { useStorefrontContext } from "@/context/StorefrontContext";
import FilterBar from "./FilterBar";
import DesktopItemGrid from "./DesktopItemGrid";
import DesktopItemCard from "./DesktopItemCard";
import Link from "next/link";

type Props = {
  /**
   * When set, caps the displayed items to this number and hides pagination.
   * Used on the home page to show only the newest/featured preview (e.g. 10).
   * Omit on /shop for the full paginated experience.
   */
  maxItems?: number;
  /** Hide the search + filter bar (useful for the home page preview) */
  hideFilters?: boolean;
};

export default function ShopSection({ maxItems, hideFilters }: Props) {
  const {
    items,
    loading,
    category,
    setCategory,
    page,
    setPage,
    totalPages,
    totalCount,
    getThumbnailUrl,
  } = useStorefrontContext();

  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (item) =>
          item.Name.toLowerCase().includes(q) ||
          (item.Description ?? "").toLowerCase().includes(q)
      );
    }
    if (maxItems) list = list.slice(0, maxItems);
    return list;
  }, [items, search, maxItems]);

  const clearFilters = () => {
    setSearch("");
    setCategory(null);
  };

  const isPreview = !!maxItems;

  return (
    <section id="shop" className="relative z-[1]" style={{ background: "var(--surface)" }}>

      {/* ── Filter bar (hidden in preview mode) ── */}
      {!hideFilters && (
        <FilterBar
          search={search}
          onSearch={setSearch}
          activeCategory={category}
          onCategory={setCategory}
          resultCount={search.trim() ? filtered.length : totalCount}
        />
      )}

      {/* ── Mobile grid ── */}
      <div className="md:hidden px-4 py-6">
        {loading ? (
          <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse overflow-hidden" style={{ background: "var(--surface-bright)", borderRadius: "0.25rem" }}>
                <div style={{ aspectRatio: "3/4", background: "var(--surface-container)" }} />
                <div className="p-3 space-y-2">
                  <div className="h-3.5 w-3/4 rounded-sm" style={{ background: "var(--surface-container)" }} />
                  <div className="h-3 w-1/3 rounded-sm" style={{ background: "var(--surface-container-low)" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="ll-display text-xl italic mb-4" style={{ color: "var(--on-surface-variant)" }}>
              No pieces found.
            </p>
            <button onClick={clearFilters} className="btn-tertiary mx-auto">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {filtered.map((item) => (
              <DesktopItemCard
                key={item.InventoryId}
                item={item}
                thumbnailUrl={getThumbnailUrl(item.InventoryId)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Desktop grid ── */}
      <div className="hidden md:block">
        <DesktopItemGrid
          items={filtered}
          getThumbnailUrl={getThumbnailUrl}
          onClearFilters={clearFilters}
          loading={loading}
        />

        {/* Pagination — only shown when not in preview mode */}
        {!isPreview && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-10 pb-12">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="btn-secondary text-[0.62rem] px-5 py-2 disabled:opacity-30"
            >
              ← Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .reduce<(number | "…")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`e-${i}`} className="ll-label px-2 text-[0.65rem]" style={{ color: "var(--on-surface-variant)" }}>…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className="ll-label h-9 w-9 text-[0.65rem] font-medium transition-all duration-400"
                    style={{
                      background:   p === page ? "var(--primary)" : "transparent",
                      color:        p === page ? "var(--on-primary)" : "var(--on-surface-variant)",
                      border:       p === page ? "1px solid var(--primary)" : "1px solid rgba(196,181,168,0.3)",
                      borderRadius: "0.25rem",
                      cursor:       "pointer",
                    }}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="btn-secondary text-[0.62rem] px-5 py-2 disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* ── "Browse full collection" CTA — shown only in preview mode ── */}
      {isPreview && !loading && filtered.length > 0 && (
        <div
          className="flex items-center justify-center py-8 px-6"
          style={{ borderTop: "1px solid rgba(196,181,168,0.15)" }}
        >
          <Link
            href="/shop"
            className="ll-label px-8 py-3 text-[0.65rem] font-medium uppercase tracking-[0.15em] transition-all duration-300"
            style={{
              border:       "1px solid rgba(196,181,168,0.4)",
              color:        "var(--on-surface-variant)",
              borderRadius: "0.25rem",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background     = "var(--primary)";
              (e.currentTarget as HTMLAnchorElement).style.color          = "var(--on-primary)";
              (e.currentTarget as HTMLAnchorElement).style.borderColor    = "var(--primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background     = "transparent";
              (e.currentTarget as HTMLAnchorElement).style.color          = "var(--on-surface-variant)";
              (e.currentTarget as HTMLAnchorElement).style.borderColor    = "rgba(196,181,168,0.4)";
            }}
          >
            Browse the Full Collection →
          </Link>
        </div>
      )}

    </section>
  );
}