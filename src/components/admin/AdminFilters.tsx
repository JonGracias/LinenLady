// src/components/admin/AdminFilters.tsx
"use client";

import React from "react";
import { useInventoryContext, type AdminFilter } from "@/context/InventoryContext";

function FilterButton({
  filter,
  active,
  onClick,
  children,
}: {
  filter: AdminFilter;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const cls = active
    ? "rounded-lg border-2 border-blue-500 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700"
    : "rounded-lg border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors";
  return (
    <button type="button" className={cls} onClick={onClick}>
      {children}
    </button>
  );
}

export function AdminFilters() {
  const { filter, setFilter, counts } = useInventoryContext();

  return (
    <div className="flex gap-3">
      <FilterButton filter="all" active={filter === "all"} onClick={() => setFilter("all")}>
        All Items ({counts.all})
      </FilterButton>
      <FilterButton filter="drafts" active={filter === "drafts"} onClick={() => setFilter("drafts")}>
        Drafts ({counts.drafts})
      </FilterButton>
      <FilterButton filter="published" active={filter === "published"} onClick={() => setFilter("published")}>
        Published ({counts.published})
      </FilterButton>
    </div>
  );
}
