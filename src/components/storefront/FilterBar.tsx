"use client";

import type { Category } from "@/types/inventory";
import CategoryPills from "./CategoryPills";
import CategoryDropdown from "./CategoryDropdown";

type Props = {
  search: string;
  onSearch: (v: string) => void;
  activeCategory: Category | null;
  onCategory: (v: Category | null) => void;
  resultCount: number;
};

export default function FilterBar({
  search,
  onSearch,
  activeCategory,
  onCategory,
  resultCount,
}: Props) {
  return (
    <div
      className="sticky top-0 z-20 border-b"
      style={{ background: "var(--cream)", borderColor: "var(--linen)" }}
    >
      {/* Trust strip */}
      <div
        className="flex items-center justify-center"
        style={{ background: "var(--ink)" }}
      >
        <span
          className="ll-label py-[1.1rem] px-10 text-[0.65rem] uppercase tracking-[0.2em] whitespace-nowrap"
          style={{ color: "var(--rose-light)" }}
        >
          Antique &amp; Vintage Linens Since 1994
        </span>
      </div>

      {/* Row 1 — search + mobile dropdown + count */}
      <div className="flex items-center gap-3 px-4 md:px-10 pt-4 pb-3">
        <div className="relative flex-1 max-w-xs">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
            style={{ color: "var(--ink-soft)" }}
          >
            ⌕
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search pieces…"
            className="ll-body w-full border bg-transparent py-2 pl-8 pr-3 text-sm font-light outline-none focus:border-[var(--rose)]"
            style={{ borderColor: "var(--linen)", color: "var(--ink)" }}
          />
        </div>

        {/* Mobile: dropdown */}
        <div className="md:hidden">
          <CategoryDropdown active={activeCategory} onChange={onCategory} />
        </div>

        {/* Count */}
        <div
          className="ll-label ml-auto text-[0.65rem] uppercase tracking-[0.15em] whitespace-nowrap"
          style={{ color: "var(--ink-soft)" }}
        >
          {resultCount} {resultCount === 1 ? "piece" : "pieces"}
        </div>
      </div>

      {/* Row 2 — desktop: category pills */}
      <div className="hidden md:block px-10 pb-3">
        <CategoryPills active={activeCategory} onChange={onCategory} />
      </div>
    </div>
  );
}