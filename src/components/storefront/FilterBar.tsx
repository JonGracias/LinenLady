// src/components/storefront/FilterBar.tsx
"use client";

import { useRouter, usePathname } from "next/navigation";
import type { Category } from "@/types/inventory";
import { CATEGORY_OPTIONS } from "@/types/inventory";

type Props = {
  search:         string;
  onSearch:       (v: string) => void;
  activeCategory: Category | null;
  onCategory:     (c: Category | null) => void;
  resultCount:    number;
};

export default function FilterBar({
  search,
  onSearch,
  activeCategory,
  onCategory,
  resultCount,
}: Props) {
  const router   = useRouter();
  const pathname = usePathname();

  function handleCategory(value: Category | null) {
    onCategory(value);
    if (value) {
      router.replace(`${pathname}?category=${value}`, { scroll: false });
    } else {
      router.replace(pathname, { scroll: false });
    }
  }

  return (
    <div
      className="sticky top-0 z-20"
      style={{
        background:   "var(--surface)",
        borderBottom: "1px solid rgba(196,181,168,0.2)",
      }}
    >
      {/* Search row */}
      <div
        className="flex items-center gap-3 px-6 md:px-10 py-3"
        style={{ borderBottom: "1px solid rgba(196,181,168,0.12)" }}
      >
        <div
          className="flex flex-1 items-center gap-2 max-w-sm"
          style={{
            border:       "1px solid rgba(196,181,168,0.35)",
            borderRadius: "0.25rem",
            background:   "var(--surface-bright)",
            padding:      "0.4rem 0.75rem",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--on-surface-variant)", flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search the collection…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="ll-body flex-1 bg-transparent outline-none text-sm font-light placeholder:italic"
            style={{ color: "var(--on-surface)", caretColor: "var(--primary)" }}
          />
          {search && (
            <button
              onClick={() => onSearch("")}
              className="ll-label text-[0.65rem] transition-opacity hover:opacity-70"
              style={{ color: "var(--on-surface-variant)" }}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <span
          className="ll-label hidden md:inline text-[0.6rem] font-medium uppercase tracking-[0.15em]"
          style={{ color: "var(--on-surface-variant)" }}
        >
          {resultCount} {resultCount === 1 ? "piece" : "pieces"}
        </span>
      </div>

      {/* Category pills */}
      <div className="flex items-center gap-0 overflow-x-auto hide-scrollbar px-6 md:px-10 py-2">
        {[{ value: null as Category | null, label: "All Pieces" }, ...CATEGORY_OPTIONS].map(({ value, label }) => {
          const isActive = activeCategory === value;
          return (
            <button
              key={label}
              onClick={() => handleCategory(value)}
              className="ll-label shrink-0 mr-1 text-[0.6rem] font-medium uppercase tracking-[0.12em] transition-all duration-300"
              style={{
                padding:      "0.3rem 0.85rem",
                background:   isActive ? "var(--primary)" : "transparent",
                color:        isActive ? "var(--on-primary)" : "var(--on-surface-variant)",
                border:       isActive ? "1px solid var(--primary)" : "1px solid rgba(196,181,168,0.25)",
                borderRadius: "0.25rem",
                cursor:       "pointer",
                whiteSpace:   "nowrap",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}