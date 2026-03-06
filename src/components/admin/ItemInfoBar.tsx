// src/components/admin/ItemInfoBar.tsx
"use client";

import { useState } from "react";
import type { InventoryItem } from "@/types/inventory";

type StatusBadge = { label: "Draft" | "Published" | "Unpublished"; className: string };

function getStatusBadge(item: InventoryItem): StatusBadge {
  if (item.IsDraft)  return { label: "Draft",       className: "bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700/50" };
  if (item.IsActive) return { label: "Published",   className: "bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700/50" };
  return                    { label: "Unpublished", className: "bg-gray-100 text-gray-600 border border-gray-300 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600/50" };
}

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString();
}

function truncate(value: string | null | undefined, max = 12) {
  if (!value) return "—";
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

type Props = { item: InventoryItem };

export function ItemInfoBar({ item }: Props) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const badge      = getStatusBadge(item);
  const skuDisplay = truncate(item.Sku, 12);

  return (
    <div className="mb-4">
        <h1 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100 sm:text-xl">
            {item.Name}
        </h1>

        <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>
            {badge.label}
            </span>
            <span className="text-xs text-gray-300 dark:text-gray-600">•</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
            ID <span className="font-mono">{item.InventoryId}</span>
            </span>
            <span className="text-xs text-gray-300 dark:text-gray-600">•</span>
            <span className="cursor-default text-sm text-gray-500 dark:text-gray-400" title={item.Sku || undefined}>
            SKU <span className="font-mono">{skuDisplay}</span>
            </span>
        </div>

        <button
            onClick={() => setDetailsOpen((o) => !o)}
            className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 transition-colors hover:text-gray-700 dark:hover:text-gray-300"
        >
            <svg
            className={`h-3 w-3 transition-transform ${detailsOpen ? "rotate-90" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {detailsOpen ? "Hide details" : "More details"}
        </button>

      {detailsOpen && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs text-gray-500 dark:text-gray-400">
                Created {formatDate(item.CreatedAt)}
            </span>
            <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs text-gray-500 dark:text-gray-400">
                Updated {formatDate(item.UpdatedAt)}
            </span>
            <span className="cursor-default text-sm text-gray-500 dark:text-gray-400" title={item.Sku || undefined}>
                SKU <span className="font-mono">{item.Sku}</span>
            </span>
            <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 font-mono text-xs text-gray-500 dark:text-gray-400">
                {item.PublicId}
            </span>
        </div>
      )}
    </div>
  );
}