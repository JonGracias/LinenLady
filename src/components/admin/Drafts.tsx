// src/app/admin/drafts/[id]/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useInventoryContext } from "@/context/InventoryContext";
import ImageCarousel from "@/components/SlideShow";
import type { InventoryItem } from "@/types/inventory";

/* ── helpers ─────────────────────────────────────────────── */

function money(cents: number) {
  const dollars = (cents ?? 0) / 100;
  return dollars.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}

function centsFromInput(val: string): number | null {
  const n = parseFloat(val);
  if (Number.isNaN(n) || n < 0) return null;
  return Math.round(n * 100);
}

/* ── edit modal (all fields) ─────────────────────────────── */

interface EditModalProps {
  open: boolean;
  name: string;
  description: string;
  priceCents: number;
  quantity: number;
  onClose: () => void;
  onSave: (fields: {
    name: string;
    description: string;
    priceCents: number;
    quantity: number;
  }) => void;
}

function EditModal({
  open,
  name,
  description,
  priceCents,
  quantity,
  onClose,
  onSave,
}: EditModalProps) {
  const [draftName, setDraftName] = useState(name);
  const [draftDesc, setDraftDesc] = useState(description);
  const [draftPrice, setDraftPrice] = useState((priceCents / 100).toFixed(2));
  const [draftQty, setDraftQty] = useState(String(quantity));
  const [aiLoading, setAiLoading] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setDraftName(name);
      setDraftDesc(description);
      setDraftPrice((priceCents / 100).toFixed(2));
      setDraftQty(String(quantity));
    }
  }, [open, name, description, priceCents, quantity]);

  if (!open) return null;

  const handleAiRewrite = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/admin/api/ai/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: draftName, description: draftDesc }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.name) setDraftName(data.name);
        if (data.description) setDraftDesc(data.description);
      }
    } catch {
      // silent
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = () => {
    const cents = centsFromInput(draftPrice);
    const qty = parseInt(draftQty, 10);
    onSave({
      name: draftName,
      description: draftDesc,
      priceCents: cents ?? priceCents,
      quantity: !Number.isNaN(qty) && qty >= 0 ? qty : quantity,
    });
    onClose();
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="w-full sm:max-w-xl rounded-t-xl sm:rounded-xl border border-gray-700 bg-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700 px-5 py-3.5 sticky top-0 bg-gray-800 z-10">
          <h2 className="text-base font-semibold text-gray-100">Edit Item</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3.5 py-2.5 text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Item name…"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              value={draftDesc}
              onChange={(e) => setDraftDesc(e.target.value)}
              rows={4}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3.5 py-2.5 text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y"
              placeholder="Item description…"
            />
          </div>

          {/* Price + Quantity side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={draftPrice}
                onChange={(e) => setDraftPrice(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3.5 py-2.5 text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                Quantity
              </label>
              <input
                type="number"
                min="0"
                value={draftQty}
                onChange={(e) => setDraftQty(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3.5 py-2.5 text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-gray-700 px-5 py-4 sticky bottom-0 bg-gray-800">
          <button
            onClick={handleAiRewrite}
            disabled={aiLoading}
            className="flex items-center justify-center gap-2 rounded-lg border border-purple-700/50 bg-purple-900/30 px-4 py-2.5 text-sm font-medium text-purple-300 hover:bg-purple-900/50 disabled:opacity-50 transition-colors"
          >
            {aiLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-400 border-r-transparent" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
            )}
            Rewrite with AI
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none rounded-lg px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 sm:flex-none rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── main component ──────────────────────────────────────── */

export default function Draft({ inventoryId }: { inventoryId: number }) {
  const router = useRouter();
  const { items, loading, error, getImages, ensureImages } = useInventoryContext();

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [itemLoading, setItemLoading] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  /* ── load item ── */
  useEffect(() => {
    if (!inventoryId || Number.isNaN(inventoryId)) return;
    let cancelled = false;

    async function loadItem() {
      setItemError(null);
      const found = items.find((i) => i.InventoryId === inventoryId);
      if (found) { if (!cancelled) setItem(found); return; }

      setItemLoading(true);
      try {
        const res = await fetch(`/admin/api/items/${inventoryId}`, { cache: "no-store" });
        if (!res.ok) { const text = await res.text(); throw new Error(text || `Failed (${res.status})`); }
        const data = (await res.json()) as InventoryItem;
        if (!cancelled) setItem(data);
      } catch (e: any) {
        if (!cancelled) { setItem(null); setItemError(e?.message ?? "Failed to load item."); }
      } finally {
        if (!cancelled) setItemLoading(false);
      }
    }

    loadItem();
    return () => { cancelled = true; };
  }, [inventoryId, items]);

  /* ── images ── */
  const images = getImages(inventoryId) || [];
  useEffect(() => {
    if (inventoryId && !Number.isNaN(inventoryId)) ensureImages(inventoryId);
  }, [inventoryId, ensureImages]);

  /* ── field updater ── */
  const updateField = useCallback(
    (patch: Partial<InventoryItem>) => {
      if (!item) return;
      setItem((prev) => (prev ? { ...prev, ...patch } : prev));
      // TODO: fire API call
    },
    [item],
  );

  /* ── early returns ── */
  if (loading || itemLoading) {
    return (
      <div className="min-h-screen bg-gray-900 p-4 md:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6">
            <button onClick={() => router.back()} className="text-sm text-blue-400 hover:text-blue-300 font-medium mb-4">← Back to items</button>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-400 border-r-transparent mb-4" />
              <p className="text-gray-400">Loading item...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || itemError) {
    return (
      <div className="min-h-screen bg-gray-900 p-4 md:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6">
            <button onClick={() => router.back()} className="text-sm text-blue-400 hover:text-blue-300 font-medium">← Back to items</button>
          </div>
          <div className="rounded-lg border border-red-800 bg-gray-800 p-8 text-center">
            <div className="text-red-400 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-100 mb-2">Error Loading Item</h2>
            <p className="text-red-400">{itemError ?? error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-900 p-4 md:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6">
            <button onClick={() => router.back()} className="text-sm text-blue-400 hover:text-blue-300 font-medium">← Back to items</button>
          </div>
          <div className="rounded-lg border border-yellow-800 bg-gray-800 p-8 text-center">
            <div className="text-yellow-400 text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold text-gray-100 mb-2">Item Not Found</h2>
            <p className="text-gray-400">No item exists with ID {inventoryId}.</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── computed ── */
  const status = item.IsDraft ? "Draft" : item.IsActive ? "Published" : "Unpublished";
  const statusColor = item.IsDraft
    ? "bg-yellow-900/50 text-yellow-300 border border-yellow-700/50"
    : item.IsActive
      ? "bg-green-900/50 text-green-300 border border-green-700/50"
      : "bg-gray-700/50 text-gray-300 border border-gray-600/50";

  const skuDisplay = item.Sku
    ? item.Sku.length > 12
      ? item.Sku.slice(0, 12) + "…"
      : item.Sku
    : "—";

  /* ── render ── */
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-3 sm:p-4 md:p-6">
      <div className="mx-auto max-w-3xl">
        {/* Back */}
        <div className="mb-1">
          <button
            onClick={() => router.back()}
            className="text-sm text-blue-400 hover:text-blue-300 font-medium inline-block"
          >
            ← Back to items
          </button>
        </div>

        {/* ── Carousel ── */}
        <div className="flex items-center justify-center py-2">
          <div className="w-full max-w-sm">
            <ImageCarousel images={images} />
          </div>
        </div>

        {/* ── Info Bar ── */}
        <div className="mb-4">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-100 mb-2">{item.Name}</h1>

          {/* Row 1: status + identifiers */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor}`}>
              {status}
            </span>
            <span className="text-gray-600 text-xs">•</span>
            <span className="text-gray-400 text-sm">
              ID <span className="font-mono">{item.InventoryId}</span>
            </span>
            <span className="text-gray-600 text-xs">•</span>
            <span
              className="text-gray-400 text-sm cursor-default"
              title={item.Sku || undefined}
            >
              SKU <span className="font-mono">{skuDisplay}</span>
            </span>
          </div>

          {/* Row 2: dates */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-gray-800 px-2.5 py-1 text-xs text-gray-400">
              Created {new Date(item.CreatedAt).toLocaleDateString()}
            </span>
            <span className="rounded-full bg-gray-800 px-2.5 py-1 text-xs text-gray-400">
              Updated {new Date(item.UpdatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* ── Combined Details Card ── */}
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-4 sm:p-5">
          {/* Top row: price, quantity, actions */}
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-6 sm:gap-8">
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Price</span>
                <p className="text-xl sm:text-2xl font-bold text-gray-100 mt-0.5">{money(item.UnitPriceCents)}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</span>
                <p className="text-lg sm:text-xl font-semibold text-gray-100 mt-0.5">{item.QuantityOnHand}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-600 bg-gray-700 px-3 sm:px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-600 hover:border-gray-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span className="hidden sm:inline">Edit</span>
              </button>
              <button
                onClick={() => updateField({ IsDraft: false, IsActive: true })}
                className={`flex items-center gap-1.5 rounded-lg px-3 sm:px-4 py-2 text-sm font-semibold transition-colors ${
                  item.IsActive
                    ? "bg-gray-700 text-gray-500 cursor-default"
                    : "bg-green-600 hover:bg-green-500 text-white"
                }`}
                disabled={item.IsActive}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {item.IsActive ? "Published" : "Publish"}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-700 mb-3" />

          {/* Name + Description */}
          <div>
            <p className="text-gray-100 font-medium mb-1">{item.Name}</p>
            <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
              {item.Description || "No description yet."}
            </p>
          </div>
        </div>
      </div>

      {/* ── Edit Modal ── */}
      <EditModal
        open={editOpen}
        name={item.Name}
        description={item.Description || ""}
        priceCents={item.UnitPriceCents}
        quantity={item.QuantityOnHand}
        onClose={() => setEditOpen(false)}
        onSave={({ name, description, priceCents, quantity }) =>
          updateField({
            Name: name,
            Description: description,
            UnitPriceCents: priceCents,
            QuantityOnHand: quantity,
          })
        }
      />
    </div>
  );
}