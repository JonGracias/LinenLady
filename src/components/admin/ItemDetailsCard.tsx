// src/components/admin/ItemDetailsCard.tsx
"use client";

import { useEffect, useState } from "react";
import type { InventoryItem } from "@/types/inventory";
import AiMetaPanel from "@/components/admin/AiMetaPanel";
import SimilarItemsPanel from "@/components/admin/SimilarItemsPanel";

function centsFromInput(val: string): number | null {
  const n = parseFloat(val);
  if (Number.isNaN(n) || n < 0) return null;
  return Math.round(n * 100);
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

  // ── Square-style inline fields (name / price / description) ──
  const [name, setName]   = useState(item.name);
  const [price, setPrice] = useState((item.unitPriceCents / 100).toFixed(2));
  const [desc, setDesc]   = useState(item.description ?? "");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Re-sync local fields when the underlying item changes (e.g. AI panel edits
  // it, or we navigate to a different piece).
  useEffect(() => {
    setName(item.name);
    setPrice((item.unitPriceCents / 100).toFixed(2));
    setDesc(item.description ?? "");
  }, [item.name, item.unitPriceCents, item.description]);

  useEffect(() => { setQty(item.quantityOnHand); }, [item.quantityOnHand]);
  useEffect(() => { setFeatured(item.isFeatured ?? false); }, [item.isFeatured]);

  const parsedCents = centsFromInput(price);
  const dirty =
    name.trim() !== item.name ||
    desc !== (item.description ?? "") ||
    (parsedCents !== null && parsedCents !== item.unitPriceCents);

  async function saveDetails() {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      await onItemUpdated({
        name:        name.trim() || item.name,
        description: desc,
        priceCents:  parsedCents ?? item.unitPriceCents,
        quantity:    qty,
        isFeatured:  featured,
      });
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  }

  async function commitQty(next: number) {
    if (next === item.quantityOnHand || qtyPending) return;
    setQtyPending(true);
    try {
      await onItemUpdated({
        name:        name.trim() || item.name,
        description: desc,
        priceCents:  parsedCents ?? item.unitPriceCents,
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
        name:        name.trim() || item.name,
        description: desc,
        priceCents:  parsedCents ?? item.unitPriceCents,
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

          {/* Price (inline editable) */}
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Price</span>
            <div className="mt-0.5 flex items-center">
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">$</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onBlur={() => { if (dirty) void saveDetails(); }}
                aria-label="Price in dollars"
                className="w-24 border-0 border-b border-transparent bg-transparent p-0 text-xl font-bold tabular-nums text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-0 dark:text-gray-100 sm:text-2xl [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
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

      {/* Name + description (inline editable, Square-style) */}
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => { if (dirty) void saveDetails(); }}
            placeholder="Item name…"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 dark:placeholder-gray-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Description
          </label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onBlur={() => { if (dirty) void saveDetails(); }}
            rows={4}
            placeholder="No description yet."
            className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm leading-relaxed text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-300 dark:placeholder-gray-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          {savedAt && !dirty && !saving && (
            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
          )}
          <button
            type="button"
            onClick={saveDetails}
            disabled={!dirty || saving}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700 dark:disabled:text-gray-500"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
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