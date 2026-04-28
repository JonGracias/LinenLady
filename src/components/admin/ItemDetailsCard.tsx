// src/components/admin/ItemDetailsCard.tsx
"use client";

import { useState } from "react";
import type { InventoryItem } from "@/types/inventory";
import AiMetaPanel from "@/components/admin/AiMetaPanel";
import SimilarItemsPanel from "@/components/admin/SimilarItemsPanel";

function formatMoney(cents?: number) {
  return ((cents ?? 0) / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });
}

type ItemUpdatedFields = {
  name: string;
  description: string;
  priceCents: number;
  quantity: number;
  isFeatured: boolean;
};

type Props = {
  item:            InventoryItem;
  onPublishToggle: () => void;
  onDeleteOpen:    () => void;
  onItemUpdated:   (fields: ItemUpdatedFields) => Promise<void>;
};

export function ItemDetailsCard({ item, onPublishToggle, onDeleteOpen, onItemUpdated }: Props) {
  const [qty, setQty]                 = useState(item.quantityOnHand);
  const [qtyPending, setQtyPending]   = useState(false);
  const [featured, setFeatured]       = useState(item.isFeatured ?? false);
  const [featPending, setFeatPending] = useState(false);

  async function commitQty(next: number) {
    if (next === item.quantityOnHand || qtyPending) return;
    setQtyPending(true);
    try {
      await onItemUpdated({
        name:        item.name,
        description: item.description ?? "",
        priceCents:  item.unitPriceCents,
        quantity:    next,
        isFeatured:  featured,
      });
    } finally {
      setQtyPending(false);
    }
  }

  async function toggleFeatured() {
    if (featPending) return;
    const next = !featured;
    setFeatured(next);
    setFeatPending(true);
    try {
      await onItemUpdated({
        name:        item.name,
        description: item.description ?? "",
        priceCents:  item.unitPriceCents,
        quantity:    qty,
        isFeatured:  next,
      });
    } catch {
      setFeatured(!next); // revert on failure
    } finally {
      setFeatPending(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5">

      {/* Price + qty + actions */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-6 sm:gap-8">

          {/* Price */}
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Price</span>
            <p className="mt-0.5 text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">
              {formatMoney(item.unitPriceCents)}
            </p>
          </div>

          {/* Qty stepper */}
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Qty</span>
            <div className="mt-0.5 flex items-center gap-1.5">
              <button
                onClick={() => {
                  const next = Math.max(0, qty - 1);
                  setQty(next);
                  void commitQty(next);
                }}
                disabled={qty <= 0 || qtyPending}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-30"
                aria-label="Decrease quantity"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                </svg>
              </button>

              <span className={[
                "min-w-[2rem] text-center text-lg font-semibold tabular-nums text-gray-900 dark:text-gray-100 transition-opacity",
                qtyPending ? "opacity-40" : "",
              ].join(" ")}>
                {qty}
              </span>

              <button
                onClick={() => {
                  const next = qty + 1;
                  setQty(next);
                  void commitQty(next);
                }}
                disabled={qtyPending}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-30"
                aria-label="Increase quantity"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Publish + delete */}
        <div className="flex items-center gap-2">
          <button
            onClick={onPublishToggle}
            className={[
              "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors sm:px-4",
              item.isActive
                ? "border border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-700/50 dark:bg-yellow-900/30 dark:text-yellow-300 dark:hover:bg-yellow-900/50"
                : "bg-green-600 text-white hover:bg-green-500",
            ].join(" ")}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {item.isActive ? "Unpublish" : "Publish"}
          </button>

          <button
            onClick={onDeleteOpen}
            aria-label="Delete item"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-400 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-500 dark:hover:border-red-700/60 dark:hover:bg-red-900/50 dark:hover:text-red-300 sm:h-10 sm:w-10"
          >
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mb-3 border-t border-gray-100 dark:border-gray-700" />

      {/* Featured toggle */}
      <div className="mb-3 flex items-center gap-2.5">
        <button
          role="checkbox"
          aria-checked={featured}
          onClick={toggleFeatured}
          disabled={featPending}
          className={[
            "relative flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors",
            featured
              ? "border-amber-400 bg-amber-400 dark:border-amber-500 dark:bg-amber-500"
              : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700 hover:border-amber-300",
            featPending ? "opacity-50" : "",
          ].join(" ")}
          aria-label="Toggle featured"
        >
          {featured && (
            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Featured
        </span>
        {featured && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            ★ Highlighted in storefront
          </span>
        )}
      </div>

      <div className="mb-3 border-t border-gray-100 dark:border-gray-700" />

      {/* Name + description */}
      <div>
        <p className="mb-1 font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          {item.description || "No description yet."}
        </p>
      </div>

      <AiMetaPanel
        inventoryId={item.inventoryId}
        itemName={item.name}
        itemDescription={item.description ?? ""}
        itemPriceCents={item.unitPriceCents}
        onItemUpdated={(fields) => onItemUpdated({
          ...fields,
          quantity:   qty,
          isFeatured: featured,
        })}
      />

      <SimilarItemsPanel inventoryId={item.inventoryId} minScore={0.50} />
    </div>
  );
}