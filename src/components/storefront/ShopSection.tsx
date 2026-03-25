"use client";

import { useState, useMemo } from "react";
import { useStorefrontContext } from "@/context/StorefrontContext";
import FilterBar from "./FilterBar";
import MobileItemSlider from "./MobileItemSlider";
import DesktopItemGrid from "./DesktopItemGrid";

export default function ShopSection() {
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

  // Search filters client-side on top of whatever the server returned
  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (item) =>
        item.Name.toLowerCase().includes(q) ||
        (item.Description ?? "").toLowerCase().includes(q)
    );
  }, [items, search]);

  const clearFilters = () => {
    setSearch("");
    setCategory(null);
  };

  return (
    <section id="shop" className="relative z-[1]" style={{ background: "var(--cream-dark)" }}>

      <FilterBar
        search={search}
        onSearch={setSearch}
        activeCategory={category}
        onCategory={setCategory}
        resultCount={search.trim() ? filtered.length : totalCount}
      />

      {/* Mobile */}
      <div className="md:hidden">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <span
              className="ll-label text-[0.7rem] uppercase tracking-[0.2em]"
              style={{ color: "var(--ink-soft)" }}
            >
              Loading…
            </span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="ll-display text-xl italic" style={{ color: "var(--ink-soft)" }}>
              No pieces found.
            </p>
            <button
              onClick={clearFilters}
              className="ll-label mt-4 text-[0.7rem] uppercase tracking-[0.15em] underline"
              style={{ color: "var(--rose-deep)", background: "none", border: "none", cursor: "pointer" }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <MobileItemSlider items={filtered} getThumbnailUrl={getThumbnailUrl} />
        )}
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <DesktopItemGrid
          items={filtered}
          getThumbnailUrl={getThumbnailUrl}
          onClearFilters={clearFilters}
          loading={loading}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-10 pb-10">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="ll-label border px-5 py-2.5 text-[0.65rem] uppercase tracking-[0.15em] transition-colors disabled:opacity-30"
              style={{ borderColor: "var(--linen)", color: "var(--ink-soft)", background: "transparent", cursor: "pointer" }}
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
                  <span key={`e-${i}`} className="ll-label px-2 text-[0.65rem]" style={{ color: "var(--ink-soft)" }}>…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className="ll-label h-9 w-9 border text-[0.65rem] transition-colors"
                    style={{
                      borderColor: p === page ? "var(--rose-deep)" : "var(--linen)",
                      background:  p === page ? "var(--rose-deep)" : "transparent",
                      color:       p === page ? "#fff" : "var(--ink-soft)",
                      cursor: "pointer",
                    }}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="ll-label border px-5 py-2.5 text-[0.65rem] uppercase tracking-[0.15em] transition-colors disabled:opacity-30"
              style={{ borderColor: "var(--linen)", color: "var(--ink-soft)", background: "transparent", cursor: "pointer" }}
            >
              Next →
            </button>
          </div>
        )}
      </div>

    </section>
  );
}