// src/components/admin/Filters.tsx
"use client";

import React from "react";
import Link from "next/link";
import { useInventoryContext, type AdminFilter } from "@/context/InventoryContext";
import { CATEGORY_OPTIONS } from "@/types/inventory";
import type { Filter } from "@/types/inventory";

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex-1 text-center rounded-lg border-2 px-2 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors",
        active
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function AdminFilters() {
  const { filter, setFilter, counts, category, setCategory } = useInventoryContext();

  const filters: { value: Filter; label: string }[] = [
    { value: "all",       label: `All (${counts.All})`            },
    { value: "drafts",    label: `Drafts (${counts.Drafts})`      },
    { value: "published", label: `Published (${counts.Published})` },
    { value: "featured",  label: "★ Featured"                     },
  ];

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Status tabs + new intake button */}
      <div className="flex items-center gap-2 sm:gap-3 w-full min-w-0">
        {filters.map(({ value, label }) => (
          <FilterButton
            key={value}
            active={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
          </FilterButton>
        ))}
        <Link
          href="/admin/intake"
          className="hidden md:inline-flex text-center rounded-lg border-2 border-blue-600 bg-blue-600 px-2 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 hover:border-blue-700 transition-colors whitespace-nowrap"
        >
          + New Intake
        </Link>
      </div>

      {/* Category dropdown */}
      <div className="flex items-center gap-2">
        <label
          htmlFor="category-filter"
          className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap"
        >
          Category
        </label>
        <select
          id="category-filter"
          value={category ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            setCategory(v === "" ? null : v as any);
          }}
          className={[
            "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
            "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300",
            category
              ? "border-blue-400 dark:border-blue-600 ring-1 ring-blue-300 dark:ring-blue-700"
              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
          ].join(" ")}
        >
          <option value="">All categories</option>
          {CATEGORY_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {category && (
          <button
            type="button"
            onClick={() => setCategory(null)}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Clear category filter"
          >
            ✕ Clear
          </button>
        )}
      </div>
    </div>
  );
}